import { prisma } from './lib/prisma';
import { PayrollService } from './modules/payroll';

async function verifyDemoScenarioOne() {
  console.log('--- VERIFYING 17_DEMO_FLOW.MD SCENARIO 1 (PAYROLL LIVE DEMO) ---');
  const payroll = new PayrollService();

  // Find the seeded September 2026 Payroll
  const payrun = await prisma.payrun.findFirst({
    where: { name: 'September 2026 Payroll' },
    include: { employees: { include: { employee: true } } },
  });

  if (!payrun) {
    throw new Error('Pre-demo checklist failed: "September 2026 Payroll" not found in DB!');
  }
  console.log(`✓ Pre-demo check: Found "${payrun.name}" in status "${payrun.status}" with ${payrun.employees.length} employees.`);

  // 1. Minute 2:00 - 3:15: Click "Compute"
  console.log('\n[Demo Minute 2:00] Triggering Compute...');
  const computeResult = await payroll.computePayrun(payrun.id);

  // Check Aditya Verma flagged with missing_contract
  const adityaWarning = computeResult.warnings.find(w => w.message.includes('Aditya Verma'));
  if (!adityaWarning || adityaWarning.type !== 'missing_contract') {
    throw new Error('Demo requirement failed: Aditya Verma was not flagged with missing_contract warning!');
  }
  console.log(`✓ [Demo Minute 2:30] Aditya Verma correctly flagged with warning: "${adityaWarning.message}"`);

  // Check other 5 employees have payslips
  if (computeResult.payslips.length !== 5) {
    throw new Error(`Expected 5 computed payslips, got ${computeResult.payslips.length}`);
  }
  console.log(`✓ [Demo Minute 2:45] 5 valid employees generated payslips with correct rules.`);

  // 2. Minute 3:15 - 4:00: Devansh Rao's Payslip breakdown & Print PDF
  const devanshPayslip = computeResult.payslips.find(p => p.employeeName === 'Devansh Rao');
  if (!devanshPayslip) {
    throw new Error('Devansh Rao payslip missing!');
  }
  console.log(`\n[Demo Minute 3:15] Devansh Rao Payslip Breakdown:`);
  for (const line of devanshPayslip.lines) {
    console.log(`  - [${line.category}] ${line.ruleName} (${line.ruleCode}): ₹${line.amount}`);
  }
  console.log(`  => Gross Total: ₹${devanshPayslip.grossTotal}`);
  console.log(`  => Net Total: ₹${devanshPayslip.netTotal}`);

  if (devanshPayslip.grossTotal !== 66000 || devanshPayslip.netTotal !== 65000) {
    throw new Error(`Devansh Rao amounts mismatch: expected Gross 66000, Net 65000. Got Gross ${devanshPayslip.grossTotal}, Net ${devanshPayslip.netTotal}`);
  }
  console.log(`✓ [Demo Minute 3:30] Amounts match exact seed contract wage (60,000 + 6,000 - 1,000 = 65,000).`);

  // Print PDF live
  const payslipRecord = await prisma.payslip.findFirst({
    where: { payrunId: payrun.id, employeeId: devanshPayslip.employeeId },
  });
  if (!payslipRecord) throw new Error('Payslip DB record not found');

  const pdfBuffer = await payroll.generatePayslipPdf(payslipRecord.id);
  const pdfHeader = new TextDecoder().decode(pdfBuffer.slice(0, 8));
  if (!pdfHeader.startsWith('%PDF-1.')) {
    throw new Error('Generated PDF has invalid header');
  }
  console.log(`✓ [Demo Minute 3:45] "Print Payslip" generated valid PDF (${pdfBuffer.length} bytes) live.`);

  // Reset September 2026 back to Draft state so the live demo starts from Draft
  await prisma.payrollWarning.deleteMany({ where: { payrunId: payrun.id } });
  await prisma.payslip.deleteMany({ where: { payrunId: payrun.id } });
  await prisma.payrun.update({ where: { id: payrun.id }, data: { status: 'Draft' } });
  console.log('\n✓ Pre-demo state restored: "September 2026 Payroll" reset to Draft status for live presentation.');

  console.log('\n===============================================================');
  console.log('--- DEMO SCENARIO 1 VERIFICATION: 100% SUCCESSFUL! ---');
  console.log('===============================================================');
}

verifyDemoScenarioOne()
  .catch((err) => {
    console.error('DEMO VERIFICATION ERROR:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
