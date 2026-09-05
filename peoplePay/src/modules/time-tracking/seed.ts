import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function seedTimeTrackingDemoData() {
  console.log('Seeding Attendance & Time Off demo data for Scenario 2...');

  // Ensure Roles
  let hrRole = await prisma.role.findFirst({ where: { name: 'HR Manager' } });
  if (!hrRole) {
    hrRole = await prisma.role.create({ data: { name: 'HR Manager' } });
  }

  let empRole = await prisma.role.findFirst({ where: { name: 'Employee' } });
  if (!empRole) {
    empRole = await prisma.role.create({ data: { name: 'Employee' } });
  }

  // Ensure Department
  let engDept = await prisma.department.findFirst({ where: { name: 'Engineering' } });
  if (!engDept) {
    engDept = await prisma.department.create({ data: { name: 'Engineering' } });
  }

  // Ensure Employee: Devansh Rao (Scenario 2 hero)
  let devansh = await prisma.employee.findFirst({ where: { workEmail: 'devansh.rao@peoplepay360.demo' } });
  if (!devansh) {
    devansh = await prisma.employee.create({
      data: {
        fullName: 'Devansh Rao',
        workEmail: 'devansh.rao@peoplepay360.demo',
        jobPosition: 'Software Engineer',
        departmentId: engDept.id,
        status: 'Active',
      },
    });
  }

  // Ensure User account for Devansh Rao
  let devanshUser = await prisma.user.findFirst({ where: { workEmail: 'devansh.rao@peoplepay360.demo' } });
  if (!devanshUser) {
    devanshUser = await prisma.user.create({
      data: {
        workEmail: 'devansh.rao@peoplepay360.demo',
        passwordHash: 'dummy_hash',
        roleId: empRole.id,
        employeeId: devansh.id,
      },
    });
  }

  // Ensure Leave Type: Annual Leave
  let annualLeave = await prisma.timeOffType.findFirst({ where: { name: 'Annual Leave' } });
  if (!annualLeave) {
    annualLeave = await prisma.timeOffType.create({
      data: {
        name: 'Annual Leave',
        unit: 'Days',
        requiresAllocation: true,
        requiresApproval: true,
        affectsPayroll: false,
        active: true,
      },
    });
  }

  // Clean and create Devansh Rao's Attendance entries for demo
  await prisma.attendance.deleteMany({ where: { employeeId: devansh.id } });

  // Entry 1: Normal Present day
  await prisma.attendance.create({
    data: {
      employeeId: devansh.id,
      checkIn: new Date('2026-09-01T09:00:00Z'),
      checkOut: new Date('2026-09-01T17:30:00Z'),
      workedHours: new Prisma.Decimal(8.5),
      status: 'Present',
    },
  });

  // Entry 2: Late day
  await prisma.attendance.create({
    data: {
      employeeId: devansh.id,
      checkIn: new Date('2026-09-02T09:40:00Z'),
      checkOut: new Date('2026-09-02T18:10:00Z'),
      workedHours: new Prisma.Decimal(8.5),
      status: 'Late',
    },
  });

  // Entry 3: Missing check-out exception (demo item in 17_DEMO_FLOW.md Minute 1:15-2:00)
  await prisma.attendance.create({
    data: {
      employeeId: devansh.id,
      checkIn: new Date('2026-09-03T09:05:00Z'),
      checkOut: null,
      workedHours: new Prisma.Decimal(0),
      status: 'Present',
    },
  });

  // Clean and create Devansh Rao's Allocation & Pending Request (17_DEMO_FLOW.md Minute 4:00-4:40)
  await prisma.timeOffRequest.deleteMany({ where: { employeeId: devansh.id } });
  await prisma.timeOffAllocation.deleteMany({ where: { employeeId: devansh.id } });

  const alloc = await prisma.timeOffAllocation.create({
    data: {
      employeeId: devansh.id,
      timeOffTypeId: annualLeave.id,
      allocatedAmount: new Prisma.Decimal(14),
      takenAmount: new Prisma.Decimal(0),
      remainingAmount: new Prisma.Decimal(14),
      status: 'Approved',
    },
  });

  // Pending Leave Request ready to be approved live during the hackathon presentation!
  await prisma.timeOffRequest.create({
    data: {
      employeeId: devansh.id,
      timeOffTypeId: annualLeave.id,
      startDate: new Date('2026-09-10'),
      endDate: new Date('2026-09-12'),
      duration: new Prisma.Decimal(3),
      status: 'Pending',
      reason: 'Attending hackathon finals in person',
      allocationId: alloc.id,
    },
  });

  console.log('✓ Time tracking demo seed completed successfully!');
}

if (require.main === module) {
  seedTimeTrackingDemoData()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
}
