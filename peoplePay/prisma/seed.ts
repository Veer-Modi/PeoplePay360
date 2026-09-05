import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // 1. Roles
  const rolesData = [
    "Admin",
    "HR Manager",
    "HR Payroll User",
    "HR Payroll Manager",
    "Employee",
  ];

  const roles: Record<string, string> = {};
  for (const roleName of rolesData) {
    const role = await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: { name: roleName },
    });
    roles[roleName] = role.id;
  }
  console.log("Roles seeded.");

  // 2. Departments
  const depts = ["Engineering", "Sales", "People Operations"];
  const departments: Record<string, string> = {};
  for (const d of depts) {
    const dept = await prisma.department.upsert({
      where: { name: d },
      update: {},
      create: { name: d },
    });
    departments[d] = dept.id;
  }
  console.log("Departments seeded.");

  // 3. Working Schedules
  const schedule40 = await prisma.workingSchedule.create({
    data: {
      name: "Standard 40hr",
      type: "Full-Time",
      weeklyHours: 40,
      days: {
        create: ["Mon", "Tue", "Wed", "Thu", "Fri"].map((day) => ({
          dayOfWeek: day,
          startTime: new Date("1970-01-01T09:00:00Z"),
          endTime: new Date("1970-01-01T17:30:00Z"),
          breakMinutes: 30,
          computedHours: 8,
        })),
      },
    },
  });

  const schedule20 = await prisma.workingSchedule.create({
    data: {
      name: "Part-Time 20hr",
      type: "Part-Time",
      weeklyHours: 20,
      days: {
        create: ["Mon", "Tue", "Wed", "Thu", "Fri"].map((day) => ({
          dayOfWeek: day,
          startTime: new Date("1970-01-01T09:00:00Z"),
          endTime: new Date("1970-01-01T13:00:00Z"),
          breakMinutes: 0,
          computedHours: 4,
        })),
      },
    },
  });
  console.log("Schedules seeded.");

  // 4. Employees & Users
  const passwordHash = await bcrypt.hash("2305", 10);

  const empData = [
    { name: "Riya Kapoor", email: "hr.manager@peoplepay360.demo", dept: "People Operations", pos: "HR Manager", schedule: schedule40.id, role: "HR Manager" },
    { name: "Karan Mehta", email: "payroll.user@peoplepay360.demo", dept: "People Operations", pos: "Payroll Specialist", schedule: schedule40.id, role: "HR Payroll User" },
    { name: "Ananya Sinha", email: "payroll.manager@peoplepay360.demo", dept: "People Operations", pos: "Payroll Lead", schedule: schedule40.id, role: "HR Payroll Manager" },
    { name: "Devansh Rao", email: "employee@peoplepay360.demo", dept: "Engineering", pos: "Software Engineer", schedule: schedule40.id, role: "Employee" },
    { name: "Priya Nair", email: "priya@peoplepay360.demo", dept: "Sales", pos: "Sales Executive", schedule: schedule40.id, role: "Employee" }, // Added dummy email for user
    { name: "Aditya Verma", email: "aditya@peoplepay360.demo", dept: "Engineering", pos: "QA Engineer", schedule: schedule20.id, role: "Employee" }, // Added dummy email for user
  ];

  const employees: Record<string, string> = {};

  for (const emp of empData) {
    const employee = await prisma.employee.upsert({
      where: { workEmail: emp.email },
      update: {},
      create: {
        fullName: emp.name,
        workEmail: emp.email,
        jobPosition: emp.pos,
        departmentId: departments[emp.dept],
        workingScheduleId: emp.schedule,
        status: "Active",
      },
    });
    employees[emp.name] = employee.id;

    await prisma.user.upsert({
      where: { workEmail: emp.email },
      update: {},
      create: {
        workEmail: emp.email,
        passwordHash,
        roleId: roles[emp.role],
        employeeId: employee.id,
      },
    });
  }

  // Admin user without employee
  await prisma.user.upsert({
    where: { workEmail: "admin@peoplepay360.demo" },
    update: {},
    create: {
      workEmail: "admin@peoplepay360.demo",
      passwordHash,
      roleId: roles["Admin"],
    },
  });
  console.log("Employees and Users seeded.");

  // 5. Salary Structure
  const structure = await prisma.salaryStructure.create({
    data: {
      name: "Regular Salary",
      active: true,
    },
  });

  const categories = ["Basic", "Allowances", "Gross", "Deductions", "Net"];
  const catIds: Record<string, string> = {};
  for (const c of categories) {
    const cat = await prisma.salaryRuleCategory.upsert({
      where: { name: c },
      update: {},
      create: { name: c },
    });
    catIds[c] = cat.id;
  }

  await prisma.salaryRule.createMany({
    data: [
      { name: "Basic Salary", code: "BASIC", sequence: 1, calculationType: "Fixed", calculationValue: "= Contract.wage", salaryStructureId: structure.id, categoryId: catIds["Basic"] },
      { name: "Transport Allowance", code: "TRANSPORT", sequence: 2, calculationType: "Percentage", calculationValue: "10", salaryStructureId: structure.id, categoryId: catIds["Allowances"] },
      { name: "Gross Salary", code: "GROSS", sequence: 3, calculationType: "Formula", calculationValue: "BASIC + TRANSPORT", salaryStructureId: structure.id, categoryId: catIds["Gross"] },
      { name: "Standard Deduction", code: "DEDUCT", sequence: 4, calculationType: "Fixed", calculationValue: "1000", salaryStructureId: structure.id, categoryId: catIds["Deductions"] },
      { name: "Net Salary", code: "NET", sequence: 5, calculationType: "Formula", calculationValue: "GROSS - DEDUCT", salaryStructureId: structure.id, categoryId: catIds["Net"] },
    ],
  });
  console.log("Salary Structure seeded.");

  // 6. Contracts
  const contracts = [
    { emp: "Priya Nair", start: new Date("2025-01-01"), end: new Date("2025-06-30"), wage: 45000, status: "Expired" },
    { emp: "Priya Nair", start: new Date("2025-07-01"), end: null, wage: 52000, status: "Active" },
    { emp: "Devansh Rao", start: new Date("2025-01-01"), end: null, wage: 60000, status: "Active" },
    { emp: "Karan Mehta", start: new Date("2025-01-01"), end: null, wage: 50000, status: "Active" },
    { emp: "Ananya Sinha", start: new Date("2025-01-01"), end: null, wage: 65000, status: "Active" },
    { emp: "Riya Kapoor", start: new Date("2025-01-01"), end: null, wage: 55000, status: "Active" },
    // Aditya Verma has no contract intentionally
  ];

  for (const c of contracts) {
    await prisma.contract.create({
      data: {
        employeeId: employees[c.emp],
        startDate: c.start,
        endDate: c.end,
        wage: c.wage,
        status: c.status,
        workingScheduleId: schedule40.id,
        salaryStructureId: structure.id,
      },
    });
  }
  console.log("Contracts seeded.");

  // 7. Time Off
  const toAnnual = await prisma.timeOffType.create({ data: { name: "Annual Leave", unit: "Days", requiresAllocation: true, requiresApproval: true, active: true } });
  await prisma.timeOffType.create({ data: { name: "Sick Leave", unit: "Days", requiresAllocation: true, requiresApproval: true, active: true } });
  await prisma.timeOffType.create({ data: { name: "Unpaid Leave", unit: "Days", requiresAllocation: false, requiresApproval: true, active: true } });

  const allocDevansh = await prisma.timeOffAllocation.create({ data: { employeeId: employees["Devansh Rao"], timeOffTypeId: toAnnual.id, allocatedAmount: 20, takenAmount: 0, remainingAmount: 20, status: "Approved" } });
  await prisma.timeOffAllocation.create({ data: { employeeId: employees["Priya Nair"], timeOffTypeId: toAnnual.id, allocatedAmount: 20, takenAmount: 5, remainingAmount: 15, status: "Approved" } });
  await prisma.timeOffAllocation.create({ data: { employeeId: employees["Aditya Verma"], timeOffTypeId: toAnnual.id, allocatedAmount: 20, takenAmount: 0, remainingAmount: 20, status: "Approved" } });

  await prisma.timeOffRequest.create({ data: { employeeId: employees["Devansh Rao"], timeOffTypeId: toAnnual.id, allocationId: allocDevansh.id, startDate: new Date("2026-10-01"), endDate: new Date("2026-10-03"), duration: 3, status: "Pending", reason: "Vacation" } });
  await prisma.timeOffRequest.create({ data: { employeeId: employees["Priya Nair"], timeOffTypeId: toAnnual.id, startDate: new Date("2025-08-01"), endDate: new Date("2025-08-05"), duration: 5, status: "Approved", reason: "Trip" } });
  console.log("Time Off seeded.");

  // 8. Attendance (Devansh: 10 days, mostly present, 1 late, 1 missing checkout. Priya: 10 days present)
  for (let i = 1; i <= 10; i++) {
    const isLate = i === 5;
    const missingOut = i === 8;
    await prisma.attendance.create({
      data: {
        employeeId: employees["Devansh Rao"],
        checkIn: new Date(`2026-09-${i.toString().padStart(2, "0")}T09:${isLate ? "30" : "00"}:00Z`),
        checkOut: missingOut ? null : new Date(`2026-09-${i.toString().padStart(2, "0")}T17:30:00Z`),
        workedHours: missingOut ? 0 : 8,
        status: isLate ? "Late" : (missingOut ? "Absent" : "Present"),
      },
    });

    await prisma.attendance.create({
      data: {
        employeeId: employees["Priya Nair"],
        checkIn: new Date(`2026-09-${i.toString().padStart(2, "0")}T09:00:00Z`),
        checkOut: new Date(`2026-09-${i.toString().padStart(2, "0")}T17:30:00Z`),
        workedHours: 8,
        status: "Present",
      },
    });
  }
  console.log("Attendance seeded.");

  // 9. Payruns
  const prAugust = await prisma.payrun.create({
    data: {
      name: "August 2025 Payroll",
      periodStart: new Date("2025-08-01"),
      periodEnd: new Date("2025-08-31"),
      status: "Paid",
      salaryStructureId: structure.id,
      createdById: (await prisma.user.findFirst({ where: { workEmail: "payroll.manager@peoplepay360.demo" } }))!.id,
    }
  });

  const activeEmps = ["Riya Kapoor", "Karan Mehta", "Ananya Sinha", "Devansh Rao", "Priya Nair"];
  for (const e of activeEmps) {
    const contract = await prisma.contract.findFirst({ where: { employeeId: employees[e], status: "Active" } });
    if (contract) {
      const p = await prisma.payslip.create({
        data: {
          payrunId: prAugust.id,
          employeeId: employees[e],
          contractId: contract.id,
          salaryStructureId: structure.id,
          periodStart: new Date("2025-08-01"),
          periodEnd: new Date("2025-08-31"),
          workedDays: 22,
          status: "Paid",
          grossTotal: Number(contract.wage) + (Number(contract.wage) * 0.10),
          netTotal: Number(contract.wage) + (Number(contract.wage) * 0.10) - 1000,
        }
      });
    }
  }

  await prisma.payrun.create({
    data: {
      name: "September 2026 Payroll",
      periodStart: new Date("2026-09-01"),
      periodEnd: new Date("2026-09-30"),
      status: "Draft",
      salaryStructureId: structure.id,
      createdById: (await prisma.user.findFirst({ where: { workEmail: "payroll.manager@peoplepay360.demo" } }))!.id,
    }
  });
  console.log("Payruns seeded.");

  console.log("Seeding finished successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
