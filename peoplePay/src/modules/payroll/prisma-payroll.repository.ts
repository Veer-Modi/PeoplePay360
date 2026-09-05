import { prisma } from "@/lib/prisma";
import { getApprovedLeavesForPeriod, getWorkedDaysForPeriod } from "@/modules/time-tracking";
import type { ComputedPayslip, EmployeePayrollInput, PayrollRepository, PayrollWarningResult, PayrunInput, PayrunStatus, SalaryStructureInput } from "./types";

const asStatus = (value: string) => value as PayrunStatus;
const mapStructure = (structure: { id: string; name: string; active: boolean; rules: Array<{ id: string; name: string; code: string; sequence: number; calculationType: string; calculationValue: string; active: boolean; category: { name: string } }> }): SalaryStructureInput => ({
  id: structure.id, name: structure.name, active: structure.active,
  rules: structure.rules.map((rule) => ({ id: rule.id, name: rule.name, code: rule.code, sequence: rule.sequence, calculationType: rule.calculationType as "Fixed" | "Percentage" | "Formula", calculationValue: rule.calculationValue, active: rule.active, category: rule.category.name })),
});

/** Prisma persistence adapter. It reads Person 2's real attendance data and writes only payroll-owned tables. */
export class PrismaPayrollRepository implements PayrollRepository {
  async getEmployee(employeeId: string): Promise<EmployeePayrollInput | null> {
    const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
    return employee ? { id: employee.id, fullName: employee.fullName, workEmail: employee.workEmail, bankDetailsPresent: Boolean(employee.bankAccountNumber) } : null;
  }

  async getWorkedDays(employeeId: string, period: { start: Date; end: Date }): Promise<number> {
    return (await getWorkedDaysForPeriod(employeeId, period.start, period.end)).workedDays;
  }

  async getUnpaidLeaveDays(employeeId: string, period: { start: Date; end: Date }): Promise<number> {
    const leaves = await getApprovedLeavesForPeriod(employeeId, period.start, period.end);
    return leaves
      .filter((l) => l.timeOffType.name.toLowerCase().includes("unpaid") || (l.timeOffType as any).affectsPayroll)
      .reduce((sum, l) => sum + Number(l.duration), 0);
  }

  async hasPayslip(payrunId: string, employeeId: string): Promise<boolean> {
    return (await prisma.payslip.count({ where: { payrunId, employeeId } })) > 0;
  }

  async createPayrun(input: Omit<PayrunInput, "id" | "status">): Promise<PayrunInput> {
    const payrun = await prisma.payrun.create({
      data: {
        name: input.name, periodStart: input.period.start, periodEnd: input.period.end,
        salaryStructureId: input.salaryStructure.id, createdById: input.createdById,
        employees: { create: input.employeeIds.map((employeeId) => ({ employeeId })) },
      },
      include: { salaryStructure: { include: { rules: { include: { category: true }, orderBy: { sequence: "asc" } } } }, employees: true },
    });
    return { id: payrun.id, name: payrun.name, period: { start: payrun.periodStart, end: payrun.periodEnd }, status: asStatus(payrun.status), salaryStructure: mapStructure(payrun.salaryStructure), employeeIds: payrun.employees.map((scope) => scope.employeeId), createdById: payrun.createdById };
  }

  async getPayrun(id: string): Promise<PayrunInput | null> {
    const payrun = await prisma.payrun.findUnique({
      where: { id },
      include: { salaryStructure: { include: { rules: { include: { category: true }, orderBy: { sequence: "asc" } } } }, employees: true },
    });
    return payrun ? { id: payrun.id, name: payrun.name, period: { start: payrun.periodStart, end: payrun.periodEnd }, status: asStatus(payrun.status), salaryStructure: mapStructure(payrun.salaryStructure), employeeIds: payrun.employees.map((scope) => scope.employeeId), createdById: payrun.createdById } : null;
  }

  async replaceComputedPayslips(payrunId: string, payslips: ComputedPayslip[]): Promise<void> {
    await prisma.$transaction(async (tx) => {
      await tx.payrollWarning.deleteMany({ where: { payrunId } });
      await tx.payslip.deleteMany({ where: { payrunId } });
      const ruleIds = [...new Set(payslips.flatMap((payslip) => payslip.lines.map((line) => line.salaryRuleId)))];
      const rules = ruleIds.length ? await tx.salaryRule.findMany({ where: { id: { in: ruleIds } }, select: { id: true, categoryId: true } }) : [];
      const categories = new Map(rules.map((rule) => [rule.id, rule.categoryId]));
      for (const payslip of payslips) {
        await tx.payslip.create({
          data: {
            payrunId, employeeId: payslip.employeeId, contractId: payslip.contractId, salaryStructureId: payslip.salaryStructureId,
            periodStart: payslip.period.start, periodEnd: payslip.period.end, workedDays: payslip.workedDays,
            status: payslip.status, grossTotal: payslip.grossTotal, netTotal: payslip.netTotal,
            lines: { create: payslip.lines.map((line) => ({ sequence: line.sequence, amount: line.amount, salaryRuleId: line.salaryRuleId, categoryId: categories.get(line.salaryRuleId)! })) },
            warnings: { create: payslip.warnings.map((warning) => ({ type: warning.type, severity: warning.severity, message: warning.message })) },
          },
        });
      }
    });
  }

  async replaceWarnings(payrunId: string, warnings: PayrollWarningResult[]): Promise<void> {
    // Payslip warnings are written with their Payslip. These are batch-level warnings such as missing contracts.
    await prisma.payrollWarning.createMany({ data: warnings.filter((warning) => warning.type === "missing_contract" || warning.type === "multiple_contracts" || warning.type === "duplicate_payslip").map((warning) => ({ payrunId, type: warning.type, severity: warning.severity, message: warning.message })) });
  }

  async updatePayrunStatus(payrunId: string, status: PayrunStatus): Promise<void> {
    await prisma.$transaction([
      prisma.payrun.update({ where: { id: payrunId }, data: { status } }),
      prisma.payslip.updateMany({ where: { payrunId }, data: { status } }),
    ]);
  }

  async listPayruns(): Promise<any[]> {
    const payruns = await prisma.payrun.findMany({
      include: {
        salaryStructure: true,
        _count: { select: { employees: true, payslips: true, warnings: true } },
      },
      orderBy: { periodStart: "desc" },
    });
    return payruns.map((p) => ({
      id: p.id,
      name: p.name,
      periodStart: p.periodStart,
      periodEnd: p.periodEnd,
      status: asStatus(p.status),
      salaryStructure: { id: p.salaryStructure.id, name: p.salaryStructure.name },
      employeeCount: p._count.employees,
      payslipCount: p._count.payslips,
      warningCount: p._count.warnings,
    }));
  }

  async getPayslips(payrunId: string): Promise<ComputedPayslip[]> {
    const rows = await prisma.payslip.findMany({ where: { payrunId }, include: { employee: true, lines: { include: { salaryRule: true, category: true }, orderBy: { sequence: "asc" } }, warnings: true } });
    return rows.map((row) => ({
      id: row.id,
      employeeId: row.employeeId, employeeName: row.employee.fullName, employeeEmail: row.employee.workEmail, contractId: row.contractId, salaryStructureId: row.salaryStructureId,
      period: { start: row.periodStart, end: row.periodEnd }, workedDays: Number(row.workedDays), status: asStatus(row.status), grossTotal: Number(row.grossTotal), netTotal: Number(row.netTotal),
      lines: row.lines.map((line) => ({ salaryRuleId: line.salaryRuleId, ruleName: line.salaryRule.name, ruleCode: line.salaryRule.code, category: line.category.name, sequence: line.sequence, amount: Number(line.amount) })),
      warnings: row.warnings.map((warning) => ({ type: warning.type as PayrollWarningResult["type"], severity: warning.severity as PayrollWarningResult["severity"], message: warning.message })),
    }));
  }

  async listPayslips(filter?: { payrunId?: string; employeeId?: string; status?: string }): Promise<any[]> {
    const where: any = {};
    if (filter?.payrunId) where.payrunId = filter.payrunId;
    if (filter?.employeeId) where.employeeId = filter.employeeId;
    if (filter?.status) where.status = filter.status;
    const rows = await prisma.payslip.findMany({
      where,
      include: {
        employee: true,
        payrun: true,
        salaryStructure: true,
      },
      orderBy: { periodStart: "desc" },
    });
    return rows.map((r) => ({
      id: r.id,
      employeeId: r.employeeId,
      employeeName: r.employee.fullName,
      employeeEmail: r.employee.workEmail,
      payrunId: r.payrunId,
      payrunName: r.payrun.name,
      salaryStructureId: r.salaryStructureId,
      salaryStructureName: r.salaryStructure.name,
      periodStart: r.periodStart,
      periodEnd: r.periodEnd,
      workedDays: Number(r.workedDays),
      status: asStatus(r.status),
      grossTotal: Number(r.grossTotal),
      netTotal: Number(r.netTotal),
    }));
  }

  async getPayslip(id: string): Promise<ComputedPayslip | null> {
    const row = await prisma.payslip.findUnique({
      where: { id },
      include: {
        employee: true,
        lines: { include: { salaryRule: true, category: true }, orderBy: { sequence: "asc" } },
        warnings: true,
      },
    });
    if (!row) {
      const fallback = await prisma.payslip.findFirst({
        where: { employeeId: id },
        include: {
          employee: true,
          lines: { include: { salaryRule: true, category: true }, orderBy: { sequence: "asc" } },
          warnings: true,
        },
        orderBy: { periodStart: "desc" },
      });
      if (!fallback) return null;
      return {
        id: fallback.id,
        employeeId: fallback.employeeId,
        employeeName: fallback.employee.fullName,
        employeeEmail: fallback.employee.workEmail,
        contractId: fallback.contractId,
        salaryStructureId: fallback.salaryStructureId,
        period: { start: fallback.periodStart, end: fallback.periodEnd },
        workedDays: Number(fallback.workedDays),
        status: asStatus(fallback.status),
        grossTotal: Number(fallback.grossTotal),
        netTotal: Number(fallback.netTotal),
        lines: fallback.lines.map((line) => ({ salaryRuleId: line.salaryRuleId, ruleName: line.salaryRule.name, ruleCode: line.salaryRule.code, category: line.category.name, sequence: line.sequence, amount: Number(line.amount) })),
        warnings: fallback.warnings.map((warning) => ({ type: warning.type as PayrollWarningResult["type"], severity: warning.severity as PayrollWarningResult["severity"], message: warning.message })),
      };
    }
    return {
      id: row.id,
      employeeId: row.employeeId,
      employeeName: row.employee.fullName,
      employeeEmail: row.employee.workEmail,
      contractId: row.contractId,
      salaryStructureId: row.salaryStructureId,
      period: { start: row.periodStart, end: row.periodEnd },
      workedDays: Number(row.workedDays),
      status: asStatus(row.status),
      grossTotal: Number(row.grossTotal),
      netTotal: Number(row.netTotal),
      lines: row.lines.map((line) => ({ salaryRuleId: line.salaryRuleId, ruleName: line.salaryRule.name, ruleCode: line.salaryRule.code, category: line.category.name, sequence: line.sequence, amount: Number(line.amount) })),
      warnings: row.warnings.map((warning) => ({ type: warning.type as PayrollWarningResult["type"], severity: warning.severity as PayrollWarningResult["severity"], message: warning.message })),
    };
  }
}
