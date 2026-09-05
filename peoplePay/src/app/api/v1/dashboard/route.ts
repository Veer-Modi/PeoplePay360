import { NextRequest, NextResponse } from "next/server";
import { PayrollAnalyticsService } from "@/modules/payroll";
import { getDashboardOperationalMetrics } from "@/modules/time-tracking";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const departmentId = searchParams.get("departmentId") || undefined;
    const periodStart = searchParams.get("periodStart") ? new Date(searchParams.get("periodStart")!) : undefined;
    const periodEnd = searchParams.get("periodEnd") ? new Date(searchParams.get("periodEnd")!) : undefined;

    const [
      payrollKpis,
      salaryCostByDepartment,
      monthlySalaryTrend,
      payrollAlerts,
      operationalMetrics,
    ] = await Promise.all([
      PayrollAnalyticsService.getPayrollKpis({ departmentId, periodStart, periodEnd }),
      PayrollAnalyticsService.getSalaryCostByDepartment(),
      PayrollAnalyticsService.getMonthlyNetSalaryTrend(),
      PayrollAnalyticsService.getPayrollAlerts(),
      getDashboardOperationalMetrics().catch(() => ({ attendance: null, timeOff: null })),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        kpis: {
          ...payrollKpis,
          approvedTimeOffDays: operationalMetrics.timeOff?.approvedLeaveDays ?? 0,
          pendingTimeOffRequests: operationalMetrics.timeOff?.pendingRequestsCount ?? 0,
          attendanceHealth: operationalMetrics.attendance,
        },
        charts: {
          salaryCostByDepartment,
          monthlySalaryTrend,
        },
        alerts: payrollAlerts,
        operational: operationalMetrics,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
