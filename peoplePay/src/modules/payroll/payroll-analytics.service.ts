import { prisma } from "@/lib/prisma";

export interface PayrollKpiSummary {
  totalNetSalaryPaid: number;
  totalGrossSalaryPaid: number;
  payslipsGenerated: number;
  paidPayslipsCount: number;
  averageNetSalary: number;
  averageGrossSalary: number;
  activePayrunsCount: number;
}

export interface DepartmentSalaryCost {
  departmentId: string | null;
  department: string;
  totalGrossCost: number;
  totalNetCost: number;
  headcount: number;
}

export interface MonthlyTrendItem {
  payrunId: string;
  name: string;
  periodStart: Date;
  periodEnd: Date;
  totalNetSalary: number;
  totalGrossSalary: number;
  payslipCount: number;
}

export interface PayrollAlertItem {
  id: string;
  type: string;
  severity: string;
  message: string;
  payrunId?: string | null;
  payrunName?: string;
  employeeName?: string;
}

/**
 * Service providing live aggregated payroll analytics to power Person 4's
 * Payroll Dashboard (BR-DASH-001) and reporting charts.
 */
export class PayrollAnalyticsService {
  static async getPayrollKpis(filters?: {
    departmentId?: string;
    periodStart?: Date;
    periodEnd?: Date;
  }): Promise<PayrollKpiSummary> {
    const wherePaid: any = { status: "Paid" };
    if (filters?.departmentId) {
      wherePaid.employee = { departmentId: filters.departmentId };
    }
    if (filters?.periodStart && filters?.periodEnd) {
      wherePaid.periodStart = { gte: filters.periodStart };
      wherePaid.periodEnd = { lte: filters.periodEnd };
    }

    const [aggregatePaid, totalPayslips, activePayruns] = await Promise.all([
      prisma.payslip.aggregate({
        where: wherePaid,
        _sum: { netTotal: true, grossTotal: true },
        _count: true,
        _avg: { netTotal: true, grossTotal: true },
      }),
      prisma.payslip.count(),
      prisma.payrun.count({
        where: { status: { in: ["Draft", "Computed", "Validated"] } },
      }),
    ]);

    const netSum = Number(aggregatePaid._sum.netTotal || 0);
    const grossSum = Number(aggregatePaid._sum.grossTotal || 0);
    const count = aggregatePaid._count;

    return {
      totalNetSalaryPaid: Math.round(netSum * 100) / 100,
      totalGrossSalaryPaid: Math.round(grossSum * 100) / 100,
      payslipsGenerated: totalPayslips,
      paidPayslipsCount: count,
      averageNetSalary: count > 0 ? Math.round((netSum / count) * 100) / 100 : 0,
      averageGrossSalary: count > 0 ? Math.round((grossSum / count) * 100) / 100 : 0,
      activePayrunsCount: activePayruns,
    };
  }

  static async getSalaryCostByDepartment(): Promise<DepartmentSalaryCost[]> {
    const payslips = await prisma.payslip.findMany({
      where: { status: "Paid" },
      include: {
        employee: {
          include: { department: true },
        },
      },
    });

    const deptMap = new Map<
      string,
      {
        departmentId: string | null;
        departmentName: string;
        grossCost: number;
        netCost: number;
        employees: Set<string>;
      }
    >();

    for (const p of payslips) {
      const deptId = p.employee.departmentId ?? "unassigned";
      const deptName = p.employee.department?.name || "General / Unassigned";

      const existing = deptMap.get(deptId) || {
        departmentId: p.employee.departmentId,
        departmentName: deptName,
        grossCost: 0,
        netCost: 0,
        employees: new Set<string>(),
      };

      existing.grossCost += Number(p.grossTotal);
      existing.netCost += Number(p.netTotal);
      existing.employees.add(p.employeeId);
      deptMap.set(deptId, existing);
    }

    return Array.from(deptMap.values()).map((d) => ({
      departmentId: d.departmentId,
      department: d.departmentName,
      totalGrossCost: Math.round(d.grossCost * 100) / 100,
      totalNetCost: Math.round(d.netCost * 100) / 100,
      headcount: d.employees.size,
    }));
  }

  static async getMonthlyNetSalaryTrend(): Promise<MonthlyTrendItem[]> {
    const payruns = await prisma.payrun.findMany({
      where: { status: "Paid" },
      include: { payslips: true },
      orderBy: { periodStart: "asc" },
    });

    return payruns.map((pr) => ({
      payrunId: pr.id,
      name: pr.name,
      periodStart: pr.periodStart,
      periodEnd: pr.periodEnd,
      totalNetSalary: Math.round(pr.payslips.reduce((s, p) => s + Number(p.netTotal), 0) * 100) / 100,
      totalGrossSalary: Math.round(pr.payslips.reduce((s, p) => s + Number(p.grossTotal), 0) * 100) / 100,
      payslipCount: pr.payslips.length,
    }));
  }

  static async getPayrollAlerts(): Promise<{
    warnings: PayrollAlertItem[];
    pendingPayruns: Array<{ id: string; name: string; status: string; periodStart: Date; periodEnd: Date }>;
    missingBankEmployees: Array<{ id: string; fullName: string; workEmail: string | null }>;
  }> {
    const [warnings, pendingPayruns, missingBankEmployees] = await Promise.all([
      prisma.payrollWarning.findMany({
        take: 30,
        include: {
          payrun: { select: { id: true, name: true } },
          payslip: { include: { employee: { select: { fullName: true } } } },
        },
      }),
      prisma.payrun.findMany({
        where: { status: { in: ["Draft", "Computed", "Validated"] } },
        select: { id: true, name: true, status: true, periodStart: true, periodEnd: true },
        orderBy: { periodStart: "desc" },
      }),
      prisma.employee.findMany({
        where: { bankAccountNumber: null, status: "Active" },
        select: { id: true, fullName: true, workEmail: true },
      }),
    ]);

    return {
      warnings: warnings.map((w) => ({
        id: w.id,
        type: w.type,
        severity: w.severity,
        message: w.message,
        payrunId: w.payrunId,
        payrunName: w.payrun?.name,
        employeeName: w.payslip?.employee?.fullName,
      })),
      pendingPayruns,
      missingBankEmployees,
    };
  }
}
