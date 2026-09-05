import { prisma } from './lib/prisma';
import { AttendanceService } from './modules/time-tracking/services/attendance.service';
import { TimeOffTypeService } from './modules/time-tracking/services/time-off-type.service';
import { AllocationService } from './modules/time-tracking/services/allocation.service';
import { TimeOffRequestService } from './modules/time-tracking/services/request.service';

async function runTests() {
  console.log('--- STARTING PERSON 2 BUSINESS LOGIC VERIFICATION ---');

  // 1. Setup seed prerequisites if not exist
  let roleHR = await prisma.role.findFirst({ where: { name: 'HR Manager' } });
  if (!roleHR) {
    roleHR = await prisma.role.create({ data: { name: 'HR Manager' } });
  }

  let roleEmp = await prisma.role.findFirst({ where: { name: 'Employee' } });
  if (!roleEmp) {
    roleEmp = await prisma.role.create({ data: { name: 'Employee' } });
  }

  let hrUser = await prisma.user.findFirst({ where: { workEmail: 'hr.manager@peoplepay360.demo' } });
  if (!hrUser) {
    hrUser = await prisma.user.create({
      data: {
        workEmail: 'hr.manager@peoplepay360.demo',
        passwordHash: 'hashed_pw',
        roleId: roleHR.id,
      },
    });
  }

  let testEmp = await prisma.employee.findFirst({ where: { workEmail: 'devansh.rao@peoplepay360.demo' } });
  if (!testEmp) {
    testEmp = await prisma.employee.create({
      data: {
        fullName: 'Devansh Rao',
        workEmail: 'devansh.rao@peoplepay360.demo',
        jobPosition: 'Software Engineer',
        status: 'Active',
      },
    });
  }

  console.log('✓ Seed prerequisites verified');

  // TEST 1: BR-ATT-001 Worked Hours Calculation
  const checkInTime = new Date('2026-09-01T09:00:00Z');
  const checkOutTime = new Date('2026-09-01T17:30:00Z');
  const workedHours = AttendanceService.calculateWorkedHours(checkInTime, checkOutTime);
  if (workedHours !== 8.5) {
    throw new Error(`BR-ATT-001 failed: Expected 8.5 worked hours, got ${workedHours}`);
  }
  console.log(`✓ BR-ATT-001 PASSED: Worked hours calculated accurately (8.5 hours)`);

  // TEST 2: Check-in and Check-out via AttendanceService
  // Clear old test attendances for clean slate
  await prisma.attendance.deleteMany({ where: { employeeId: testEmp.id } });

  const record = await AttendanceService.checkIn({
    employeeId: testEmp.id,
    checkIn: checkInTime,
  });
  if (!record.id || record.workedHours.toNumber() !== 0) {
    throw new Error('Check-in failed');
  }

  const checkedOutRecord = await AttendanceService.checkOut({
    attendanceId: record.id,
    checkOut: checkOutTime,
  });
  if (checkedOutRecord.workedHours.toNumber() !== 8.5) {
    throw new Error(`Check-out failed: Expected 8.5, got ${checkedOutRecord.workedHours.toNumber()}`);
  }
  console.log(`✓ Attendance Check-In & Check-Out flow PASSED`);

  // TEST 3: BR-ATT-002 Correction Authorization
  const corrected = await AttendanceService.correctAttendance({
    attendanceId: record.id,
    checkOut: new Date('2026-09-01T18:00:00Z'),
    correctionReason: 'Approved overtime work',
    correctedById: hrUser.id,
  });
  if (corrected.workedHours.toNumber() !== 9.0 || !corrected.correctedAt) {
    throw new Error('BR-ATT-002 failed: Correction did not properly recompute or stamp audit log');
  }
  console.log(`✓ BR-ATT-002 PASSED: Authorized correction stamped with auditor ID and recomputed to 9.0 hrs`);

  // TEST 4: Time Off Type & Allocation Creation
  let paidLeaveType = await prisma.timeOffType.findFirst({ where: { name: 'Annual Leave' } });
  if (!paidLeaveType) {
    paidLeaveType = await TimeOffTypeService.createType({
      name: 'Annual Leave',
      unit: 'Days',
      requiresAllocation: true,
      requiresApproval: true,
    });
  }
  console.log(`✓ Time Off Type 'Annual Leave' verified`);

  // Clean old allocations and requests
  await prisma.timeOffRequest.deleteMany({ where: { employeeId: testEmp.id } });
  await prisma.timeOffAllocation.deleteMany({ where: { employeeId: testEmp.id } });

  const draftAlloc = await AllocationService.createAllocation({
    employeeId: testEmp.id,
    timeOffTypeId: paidLeaveType.id,
    allocatedAmount: 10,
  });
  if (draftAlloc.status !== 'Draft' || draftAlloc.remainingAmount.toNumber() !== 10) {
    throw new Error('BR-LEAVE-001 failed: Allocation must start in Draft status');
  }
  console.log(`✓ Allocation created in Draft status (10 days)`);

  // TEST 5: BR-LEAVE-001 & BR-LEAVE-002 (Approval Consumes Allocation Atomically)
  // First approve the allocation
  await AllocationService.approveAllocation(draftAlloc.id, hrUser.id);
  console.log(`✓ Allocation approved and made usable`);

  // Submit leave request for 3 days
  const leaveReq = await TimeOffRequestService.submitRequest({
    employeeId: testEmp.id,
    timeOffTypeId: paidLeaveType.id,
    startDate: new Date('2026-09-10'),
    endDate: new Date('2026-09-12'),
    duration: 3,
    allocationId: draftAlloc.id,
  });
  if (leaveReq.status !== 'Pending') {
    throw new Error('Request must start in Pending status');
  }

  // Approve leave request (atomically deducts balance)
  const approvedReq = await TimeOffRequestService.approveRequest(leaveReq.id, hrUser.id);
  if (approvedReq.status !== 'Approved') {
    throw new Error('Request approval status failed');
  }

  // Verify allocation balance after approval
  const updatedAlloc = await prisma.timeOffAllocation.findUnique({ where: { id: draftAlloc.id } });
  if (
    updatedAlloc?.takenAmount.toNumber() !== 3 ||
    updatedAlloc?.remainingAmount.toNumber() !== 7
  ) {
    throw new Error(
      `BR-LEAVE-002 failed: Expected taken=3, remaining=7. Got taken=${updatedAlloc?.takenAmount}, remaining=${updatedAlloc?.remainingAmount}`
    );
  }
  console.log(`✓ BR-LEAVE-002 PASSED: Approved 3-day request atomically updated allocation: taken=3, remaining=7`);

  // TEST 6: VAL-LEAVE-001 (Insufficient balance prevents approval)
  const excessReq = await TimeOffRequestService.submitRequest({
    employeeId: testEmp.id,
    timeOffTypeId: paidLeaveType.id,
    startDate: new Date('2026-09-15'),
    endDate: new Date('2026-09-25'),
    duration: 10, // Only 7 remaining!
    allocationId: draftAlloc.id,
  });

  let threwInsufficientError = false;
  try {
    await TimeOffRequestService.approveRequest(excessReq.id, hrUser.id);
  } catch (err: any) {
    if (err.message.includes('Insufficient leave balance')) {
      threwInsufficientError = true;
    }
  }
  if (!threwInsufficientError) {
    throw new Error('VAL-LEAVE-001 failed: Approval should be blocked when requested > remaining');
  }
  console.log(`✓ VAL-LEAVE-001 PASSED: Over-allocation request correctly blocked with insufficient balance error`);

  // TEST 7: BR-LEAVE-003 (Refusal does not touch allocation balance)
  const refusedReq = await TimeOffRequestService.refuseRequest(excessReq.id, hrUser.id);
  if (refusedReq.status !== 'Refused') {
    throw new Error('Refusal status failed');
  }

  const allocAfterRefusal = await prisma.timeOffAllocation.findUnique({ where: { id: draftAlloc.id } });
  if (
    allocAfterRefusal?.takenAmount.toNumber() !== 3 ||
    allocAfterRefusal?.remainingAmount.toNumber() !== 7
  ) {
    throw new Error('BR-LEAVE-003 failed: Refusal mutated allocation balance');
  }
  console.log(`✓ BR-LEAVE-003 PASSED: Refused request left allocation balance 100% untouched (taken=3, remaining=7)`);

  console.log('--- ALL PERSON 2 BUSINESS LOGIC TESTS PASSED SUCCESSFULLY! ---');
}

runTests()
  .catch((e) => {
    console.error('TEST ERROR:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
