import { NextRequest, NextResponse } from "next/server";
import { PayrollService } from "@/modules/payroll";

const payrollService = new PayrollService();

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const payslip = await payrollService.getPayslip(id);
    if (!payslip) {
      return NextResponse.json({ success: false, error: "Payslip not found." }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: payslip });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
