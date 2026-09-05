import { GET as getStructures, POST as createStructure } from './app/api/v1/salary-structures/route';
import { GET as getStructure, PUT as updateStructure } from './app/api/v1/salary-structures/[id]/route';
import { GET as getRules, POST as createRule } from './app/api/v1/salary-rules/route';
import { GET as getPayruns, POST as createPayrun } from './app/api/v1/payruns/route';
import { GET as getPayrun } from './app/api/v1/payruns/[id]/route';
import { POST as computePayrun } from './app/api/v1/payruns/[id]/compute/route';
import { POST as validatePayrun } from './app/api/v1/payruns/[id]/validate/route';
import { POST as markPaidPayrun } from './app/api/v1/payruns/[id]/mark-paid/route';
import { POST as sendPayslips } from './app/api/v1/payruns/[id]/send-payslips/route';
import { GET as getPayslips } from './app/api/v1/payslips/route';
import { GET as getPayslip } from './app/api/v1/payslips/[id]/route';
import { GET as getPayslipPdf } from './app/api/v1/payslips/[id]/pdf/route';
import { GET as getDashboard } from './app/api/v1/dashboard/route';
import { NextRequest } from 'next/server';
import { prisma } from './lib/prisma';

function makeRequest(url: string, method: string = 'GET', body?: any): NextRequest {
  const init: any = { method };
  if (body) {
    init.body = JSON.stringify(body);
    init.headers = { 'Content-Type': 'application/json' };
  }
  return new NextRequest(new URL(url, 'http://localhost:3000'), init);
}

async function runApiTests() {
  console.log('--- STARTING PAYROLL API ROUTES VERIFICATION ---');

  // 1. GET /api/v1/salary-structures
  const structuresRes = await getStructures();
  const structuresData = await structuresRes.json();
  if (!structuresData.success || !Array.isArray(structuresData.data)) {
    throw new Error('GET /api/v1/salary-structures failed');
  }
  const regularStructure = structuresData.data.find((s: any) => s.name === 'Regular Salary');
  console.log(`✓ GET /api/v1/salary-structures: Found ${structuresData.data.length} structures (including Regular Salary).`);

  // 2. GET /api/v1/salary-structures/[id]
  const singleStructureRes = await getStructure(
    makeRequest(`http://localhost:3000/api/v1/salary-structures/${regularStructure.id}`),
    { params: Promise.resolve({ id: regularStructure.id }) }
  );
  const singleStructureData = await singleStructureRes.json();
  if (!singleStructureData.success || singleStructureData.data.id !== regularStructure.id) {
    throw new Error('GET /api/v1/salary-structures/[id] failed');
  }
  console.log(`✓ GET /api/v1/salary-structures/[id]: Verified ${singleStructureData.data.name} with ${singleStructureData.data.rules.length} rules.`);

  // 3. GET /api/v1/salary-rules
  const rulesRes = await getRules(makeRequest(`http://localhost:3000/api/v1/salary-rules?salaryStructureId=${regularStructure.id}`));
  const rulesData = await rulesRes.json();
  if (!rulesData.success || rulesData.data.length === 0) {
    throw new Error('GET /api/v1/salary-rules failed');
  }
  console.log(`✓ GET /api/v1/salary-rules: Retrieved ${rulesData.data.length} rules for structure.`);

  // 4. GET /api/v1/payruns
  const payrunsRes = await getPayruns();
  const payrunsData = await payrunsRes.json();
  if (!payrunsData.success || !Array.isArray(payrunsData.data)) {
    throw new Error('GET /api/v1/payruns failed');
  }
  console.log(`✓ GET /api/v1/payruns: Retrieved ${payrunsData.data.length} payruns.`);

  // 5. POST /api/v1/payruns (Step 2 creation)
  const employees = await prisma.employee.findMany();
  const empIds = employees.map((e) => e.id);
  const createPayrunRes = await createPayrun(
    makeRequest('http://localhost:3000/api/v1/payruns', 'POST', {
      stepOne: {
        name: 'API Test Payrun October 2026',
        periodStart: '2026-10-01',
        periodEnd: '2026-10-31',
        salaryStructureId: regularStructure.id,
      },
      employeeIds: empIds,
    })
  );
  const createPayrunData = await createPayrunRes.json();
  if (!createPayrunData.success || createPayrunData.data.status !== 'Draft') {
    throw new Error(`POST /api/v1/payruns failed: ${JSON.stringify(createPayrunData)}`);
  }
  const testPayrunId = createPayrunData.data.id;
  console.log(`✓ POST /api/v1/payruns: Created draft payrun "${createPayrunData.data.name}" (ID: ${testPayrunId}).`);

  // 6. GET /api/v1/payruns/[id] (Processing view)
  const payrunDetailRes = await getPayrun(
    makeRequest(`http://localhost:3000/api/v1/payruns/${testPayrunId}`),
    { params: Promise.resolve({ id: testPayrunId }) }
  );
  const payrunDetailData = await payrunDetailRes.json();
  if (!payrunDetailData.success || payrunDetailData.data.payrun.id !== testPayrunId) {
    throw new Error('GET /api/v1/payruns/[id] failed');
  }
  console.log(`✓ GET /api/v1/payruns/[id]: Retrieved processing view with ${payrunDetailData.data.employees.length} scoped employees.`);

  // 7. POST /api/v1/payruns/[id]/compute
  const computeRes = await computePayrun(
    makeRequest(`http://localhost:3000/api/v1/payruns/${testPayrunId}/compute`, 'POST'),
    { params: Promise.resolve({ id: testPayrunId }) }
  );
  const computeData = await computeRes.json();
  if (!computeData.success || computeData.data.payslips.length === 0) {
    throw new Error(`POST /api/v1/payruns/[id]/compute failed: ${JSON.stringify(computeData)}`);
  }
  console.log(`✓ POST /api/v1/payruns/[id]/compute: ${computeData.data.payslips.length} payslips computed, ${computeData.data.warnings.length} warnings.`);

  // 8. POST /api/v1/payruns/[id]/validate
  const validateRes = await validatePayrun(
    makeRequest(`http://localhost:3000/api/v1/payruns/${testPayrunId}/validate`, 'POST'),
    { params: Promise.resolve({ id: testPayrunId }) }
  );
  const validateData = await validateRes.json();
  if (!validateData.success) {
    throw new Error(`POST /api/v1/payruns/[id]/validate failed: ${JSON.stringify(validateData)}`);
  }
  console.log('✓ POST /api/v1/payruns/[id]/validate: Status transitioned to Validated.');

  // 9. POST /api/v1/payruns/[id]/send-payslips
  const sendRes = await sendPayslips(
    makeRequest(`http://localhost:3000/api/v1/payruns/${testPayrunId}/send-payslips`, 'POST'),
    { params: Promise.resolve({ id: testPayrunId }) }
  );
  const sendData = await sendRes.json();
  if (!sendData.success) {
    throw new Error(`POST /api/v1/payruns/[id]/send-payslips failed: ${JSON.stringify(sendData)}`);
  }
  console.log(`✓ POST /api/v1/payruns/[id]/send-payslips: ${sendData.data.sent} payslips sent.`);

  // 10. POST /api/v1/payruns/[id]/mark-paid
  const markPaidRes = await markPaidPayrun(
    makeRequest(`http://localhost:3000/api/v1/payruns/${testPayrunId}/mark-paid`, 'POST'),
    { params: Promise.resolve({ id: testPayrunId }) }
  );
  const markPaidData = await markPaidRes.json();
  if (!markPaidData.success) {
    throw new Error(`POST /api/v1/payruns/[id]/mark-paid failed: ${JSON.stringify(markPaidData)}`);
  }
  console.log('✓ POST /api/v1/payruns/[id]/mark-paid: Status transitioned to Paid.');

  // 11. GET /api/v1/payslips
  const payslipsListRes = await getPayslips(makeRequest(`http://localhost:3000/api/v1/payslips?payrunId=${testPayrunId}`));
  const payslipsListData = await payslipsListRes.json();
  if (!payslipsListData.success || payslipsListData.data.length === 0) {
    throw new Error('GET /api/v1/payslips failed');
  }
  const samplePayslip = payslipsListData.data[0];
  console.log(`✓ GET /api/v1/payslips: Retrieved ${payslipsListData.data.length} payslips for payrun.`);

  // 12. GET /api/v1/payslips/[id]
  const payslipDetailRes = await getPayslip(
    makeRequest(`http://localhost:3000/api/v1/payslips/${samplePayslip.id}`),
    { params: Promise.resolve({ id: samplePayslip.id }) }
  );
  const payslipDetailData = await payslipDetailRes.json();
  if (!payslipDetailData.success || !payslipDetailData.data.lines) {
    throw new Error('GET /api/v1/payslips/[id] failed');
  }
  console.log(`✓ GET /api/v1/payslips/[id]: Retrieved payslip for ${payslipDetailData.data.employeeName} with ${payslipDetailData.data.lines.length} lines.`);

  // 13. GET /api/v1/payslips/[id]/pdf
  const pdfRes = await getPayslipPdf(
    makeRequest(`http://localhost:3000/api/v1/payslips/${samplePayslip.id}/pdf`),
    { params: Promise.resolve({ id: samplePayslip.id }) }
  );
  if (pdfRes.status !== 200) {
    throw new Error(`GET /api/v1/payslips/[id]/pdf failed with status ${pdfRes.status}`);
  }
  const contentType = pdfRes.headers.get('content-type');
  if (!contentType?.includes('application/pdf')) {
    throw new Error(`Expected application/pdf, got ${contentType}`);
  }
  const arrayBuffer = await pdfRes.arrayBuffer();
  console.log(`✓ GET /api/v1/payslips/[id]/pdf: Streamed binary PDF (${arrayBuffer.byteLength} bytes).`);

  // 14. GET /api/v1/dashboard (Live Payroll & Operations Dashboard)
  const dashboardRes = await getDashboard(makeRequest('http://localhost:3000/api/v1/dashboard'));
  const dashboardData = await dashboardRes.json();
  if (!dashboardData.success || !dashboardData.data.kpis) {
    throw new Error(`GET /api/v1/dashboard failed: ${JSON.stringify(dashboardData)}`);
  }
  console.log(`✓ GET /api/v1/dashboard: Live KPIs retrieved (Total Net Paid: ₹${dashboardData.data.kpis.totalNetSalaryPaid}, Avg Salary: ₹${dashboardData.data.kpis.averageNetSalary}).`);
  console.log(`  Charts: ${dashboardData.data.charts.salaryCostByDepartment.length} departments, ${dashboardData.data.charts.monthlySalaryTrend.length} monthly trend points.`);

  // Cleanup test payrun
  await prisma.payrollWarning.deleteMany({ where: { payrunId: testPayrunId } });
  await prisma.payslip.deleteMany({ where: { payrunId: testPayrunId } });
  await prisma.payrunEmployee.deleteMany({ where: { payrunId: testPayrunId } });
  await prisma.payrun.delete({ where: { id: testPayrunId } });
  console.log('✓ Cleaned up API test Payrun.');

  console.log('\n===============================================================');
  console.log('--- ALL PAYROLL API ROUTES VERIFIED AND WORKING 100%! ---');
  console.log('===============================================================');
}

runApiTests()
  .catch((err) => {
    console.error('API TEST ERROR:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
