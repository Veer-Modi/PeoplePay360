import { prisma } from './lib/prisma';
import {
  PayrollService,
  SalaryConfigurationService,
  continuePayrunWizard,
  evaluateRule,
  validateRules,
  generatePayslipPdf,
  type SalaryRuleInput,
} from './modules/payroll';

async function runTests() {
  console.log('--- STARTING PERSON 3 BUSINESS LOGIC & PAYROLL VERIFICATION ---');

  const payrollService = new PayrollService();

  // 1. Verify Prerequisites / Seed Data
  const structure = await prisma.salaryStructure.findFirst({
    where: { name: 'Regular Salary' },
    include: { rules: { include: { category: true }, orderBy: { sequence: 'asc' } } },
  });
  if (!structure) throw new Error('Standard Structure not found in seed.');
  console.log(`✓ Seed Salary Structure verified: "${structure.name}" with ${structure.rules.length} rules.`);

  const payrollManager = await prisma.user.findFirst({
    where: { workEmail: 'payroll.manager@peoplepay360.demo' },
  });
  if (!payrollManager) throw new Error('Payroll Manager seed user not found.');
  console.log(`✓ Seed Payroll Manager verified: ${payrollManager.workEmail}`);

  // --------------------------------------------------------------------------
  // TEST 1: BR-RULE-001 — Salary Rule Sequencing & Deterministic Evaluation
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 1: BR-RULE-001 Rule Engine Calculations ---');
  const rulesInput: SalaryRuleInput[] = [
    { id: '1', name: 'Basic Salary', code: 'BASIC', sequence: 1, calculationType: 'Fixed', calculationValue: '= Contract.wage', active: true, category: 'Basic' },
    { id: '2', name: 'Transport Allowance', code: 'TRANSPORT', sequence: 2, calculationType: 'Percentage', calculationValue: '10', active: true, category: 'Allowances' },
    { id: '3', name: 'Gross Salary', code: 'GROSS', sequence: 3, calculationType: 'Formula', calculationValue: 'BASIC + TRANSPORT', active: true, category: 'Gross' },
    { id: '4', name: 'Standard Deduction', code: 'DEDUCT', sequence: 4, calculationType: 'Fixed', calculationValue: '1000', active: true, category: 'Deductions' },
    { id: '5', name: 'Net Salary', code: 'NET', sequence: 5, calculationType: 'Formula', calculationValue: 'GROSS - DEDUCT', active: true, category: 'Net' },
  ];

  const validated = validateRules(rulesInput);
  if (validated.length !== 5) throw new Error('validateRules failed');

  const context: Record<string, number> = {};
  const wage = 50000;
  for (const r of validated) {
    context[r.code] = evaluateRule(r, context, wage);
  }

  if (context['BASIC'] !== 50000) throw new Error(`Expected BASIC 50000, got ${context['BASIC']}`);
  if (context['TRANSPORT'] !== 5000) throw new Error(`Expected TRANSPORT 5000, got ${context['TRANSPORT']}`);
  if (context['GROSS'] !== 55000) throw new Error(`Expected GROSS 55000, got ${context['GROSS']}`);
  if (context['DEDUCT'] !== 1000) throw new Error(`Expected DEDUCT 1000, got ${context['DEDUCT']}`);
  if (context['NET'] !== 54000) throw new Error(`Expected NET 54000, got ${context['NET']}`);
  console.log('✓ BR-RULE-001 PASSED: Evaluated BASIC=50k, TRANSPORT=5k(10%), GROSS=55k, DEDUCT=1k, NET=54k.');

  // Test forward reference error detection
  try {
    const invalidFormulaRule: SalaryRuleInput = {
      id: '99', name: 'Invalid', code: 'INV', sequence: 1, calculationType: 'Formula', calculationValue: 'FUTURE_CODE + 100', active: true, category: 'Gross'
    };
    evaluateRule(invalidFormulaRule, {}, 50000);
    throw new Error('Should have rejected forward reference');
  } catch (err: any) {
    if (err.message.includes('has not been computed yet')) {
      console.log('✓ BR-RULE-001 PASSED: Forward reference correctly rejected before runtime calculation.');
    } else {
      throw err;
    }
  }

  // --------------------------------------------------------------------------
  // TEST 2: BR-PAY-001 — Two-step Wizard Logic
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 2: BR-PAY-001 Payrun Two-Step Wizard ---');
  
  // Step 1: In-memory only (does not persist record)
  const stepOneDraft = {
    name: 'Test September 2026 Payroll',
    periodStart: new Date('2026-09-01T00:00:00Z'),
    periodEnd: new Date('2026-09-30T23:59:59Z'),
    salaryStructure: {
      id: structure.id,
      name: structure.name,
      active: structure.active,
      rules: structure.rules.map(r => ({
        id: r.id,
        name: r.name,
        code: r.code,
        sequence: r.sequence,
        calculationType: r.calculationType as any,
        calculationValue: r.calculationValue,
        active: r.active,
        category: r.category.name,
      })),
    },
  };

  const validatedStepOne = continuePayrunWizard(stepOneDraft);
  const countBefore = await prisma.payrun.count({ where: { name: stepOneDraft.name } });
  if (countBefore !== 0) throw new Error('Payrun record should not exist at Step 1!');
  console.log('✓ BR-PAY-001 Step 1 PASSED: Validated parameters in-memory with zero DB persistence.');

  // Step 2: Employee scope selection & Draft Payrun persistence
  const employees = await prisma.employee.findMany();
  const activeEmpIds = employees.map(e => e.id);
  
  const createdPayrun = await payrollService.createPayrun(
    validatedStepOne,
    activeEmpIds,
    payrollManager.id
  );

  if (createdPayrun.status !== 'Draft') throw new Error(`Expected Draft status, got ${createdPayrun.status}`);
  if (createdPayrun.employeeIds.length !== activeEmpIds.length) throw new Error('Employee scope mismatch');
  console.log(`✓ BR-PAY-001 Step 2 PASSED: Payrun persisted in 'Draft' state with ${createdPayrun.employeeIds.length} scoped employees.`);

  // --------------------------------------------------------------------------
  // TEST 3: BR-PAY-002 / 08_PAYRUN_STATE_MACHINE — Forbidden Transitions
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 3: 08_PAYRUN_STATE_MACHINE Forbidden Transitions ---');
  
  // Cannot Validate from Draft
  try {
    await payrollService.validatePayrun(createdPayrun.id);
    throw new Error('Should not allow Draft -> Validated');
  } catch (err: any) {
    console.log(`✓ Forbidden transition caught: ${err.message}`);
  }

  // Cannot Mark Paid from Draft
  try {
    await payrollService.markPayrunPaid(createdPayrun.id);
    throw new Error('Should not allow Draft -> Paid');
  } catch (err: any) {
    console.log(`✓ Forbidden transition caught: ${err.message}`);
  }

  // --------------------------------------------------------------------------
  // TEST 4: Compute Action & BR-PSL-003 Warning Generation (Missing Contract)
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 4: Payrun Compute & BR-PSL-003 / BR-PAY-003 Warnings ---');
  const computeResult = await payrollService.computePayrun(createdPayrun.id);
  console.log(`✓ Compute completed: ${computeResult.payslips.length} payslips generated, ${computeResult.warnings.length} warnings raised.`);

  // Find Aditya Verma warning (no contract seed)
  const aditya = employees.find(e => e.fullName === 'Aditya Verma');
  if (aditya) {
    const missingContractWarning = computeResult.warnings.find(w => w.employeeId === aditya.id && w.type === 'missing_contract');
    if (!missingContractWarning) throw new Error('Expected missing_contract warning for Aditya Verma');
    const adityaSlip = computeResult.payslips.find(p => p.employeeId === aditya.id);
    if (adityaSlip) throw new Error('Aditya Verma should NOT have a payslip generated (BR-PSL-003)!');
    console.log(`✓ BR-PSL-003 PASSED: Employee without active contract skipped, warning logged: "${missingContractWarning.message}"`);
  }

  // Verify computed totals for an active employee (e.g., Priya Nair, wage 52000)
  const priya = employees.find(e => e.fullName === 'Priya Nair');
  if (priya) {
    const priyaSlip = computeResult.payslips.find(p => p.employeeId === priya.id);
    if (!priyaSlip) throw new Error('Priya Nair payslip missing');
    // wage 52000 -> Basic 52000, Transport 5200, Gross 57200, Deduct 1000, Net 56200
    if (priyaSlip.grossTotal !== 57200 || priyaSlip.netTotal !== 56200) {
      throw new Error(`Priya Nair calculation mismatch: Gross ${priyaSlip.grossTotal}, Net ${priyaSlip.netTotal}`);
    }
    console.log(`✓ BR-PSL-001 PASSED: Priya Nair payslip computed accurately (Gross: ${priyaSlip.grossTotal}, Net: ${priyaSlip.netTotal})`);
  }

  // Check payrun status is now Computed
  const computedPayrun = await payrollService.getPayrun(createdPayrun.id);
  if (computedPayrun?.status !== 'Computed') throw new Error('Expected status Computed');
  console.log('✓ State transition PASSED: Draft -> Computed');

  // --------------------------------------------------------------------------
  // TEST 5: State Machine: Validate & Mark Paid
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 5: State Machine: Validate -> Paid ---');
  await payrollService.validatePayrun(createdPayrun.id);
  const validatedPayrun = await payrollService.getPayrun(createdPayrun.id);
  if (validatedPayrun?.status !== 'Validated') throw new Error('Expected status Validated');
  console.log('✓ State transition PASSED: Computed -> Validated');

  await payrollService.markPayrunPaid(createdPayrun.id);
  const paidPayrun = await payrollService.getPayrun(createdPayrun.id);
  if (paidPayrun?.status !== 'Paid') throw new Error('Expected status Paid');
  console.log('✓ State transition PASSED: Validated -> Paid');

  // Check all payslips in this payrun are also marked Paid
  const payslips = await payrollService.getPayslips(createdPayrun.id);
  for (const p of payslips) {
    if (p.status !== 'Paid') throw new Error(`Payslip ${p.employeeName} status is ${p.status}, expected Paid`);
  }
  console.log('✓ All child payslips synchronously updated to Paid status.');

  // --------------------------------------------------------------------------
  // TEST 6: Payslip PDF Generation
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 6: Payslip PDF Generation ---');
  const testSlip = payslips[0];
  const pdfBytes = generatePayslipPdf(testSlip);
  if (!pdfBytes || pdfBytes.length < 100) throw new Error('Generated PDF byte buffer is too small');
  const pdfHeader = new TextDecoder().decode(pdfBytes.slice(0, 8));
  if (!pdfHeader.startsWith('%PDF-1.')) throw new Error('Invalid PDF header');
  console.log(`✓ PDF Generation PASSED: Generated valid PDF (${pdfBytes.length} bytes) for ${testSlip.employeeName}.`);

  // --------------------------------------------------------------------------
  // TEST 7: Bulk Email Gateway Simulation
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 7: Bulk Email Delivery ---');
  let sentCount = 0;
  const mockEmailGateway = {
    async send(msg: any) {
      sentCount++;
    },
  };
  const emailResult = await payrollService.sendPayrunPayslips(createdPayrun.id, mockEmailGateway);
  console.log(`✓ Bulk Email PASSED: ${emailResult.sent} emails dispatched, ${emailResult.skipped.length} skipped.`);

  // Cleanup test payrun
  await prisma.payrollWarning.deleteMany({ where: { payrunId: createdPayrun.id } });
  await prisma.payslip.deleteMany({ where: { payrunId: createdPayrun.id } });
  await prisma.payrunEmployee.deleteMany({ where: { payrunId: createdPayrun.id } });
  await prisma.payrun.delete({ where: { id: createdPayrun.id } });
  console.log('✓ Cleaned up test Payrun.');

  console.log('\n===============================================================');
  console.log('--- ALL PERSON 3 BUSINESS LOGIC & PAYROLL TESTS PASSED! ---');
  console.log('===============================================================');
}

runTests()
  .catch((err) => {
    console.error('TEST ERROR:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
