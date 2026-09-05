import { NextRequest, NextResponse } from "next/server";
import { PayrollService } from "@/modules/payroll";

const payrollService = new PayrollService();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const payrunId = searchParams.get("payrunId") || undefined;
    const employeeId = searchParams.get("employeeId") || undefined;
    const status = searchParams.get("status") || undefined;

    const payslips = await payrollService.listPayslips({ payrunId, employeeId, status });
    return NextResponse.json({ success: true, data: payslips });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
