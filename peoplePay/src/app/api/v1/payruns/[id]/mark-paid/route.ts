import { NextRequest, NextResponse } from "next/server";
import { PayrollService, PayrollDomainError } from "@/modules/payroll";

const payrollService = new PayrollService();

export async function POST(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    await payrollService.markPayrunPaid(id);
    return NextResponse.json({
      success: true,
      message: "Payrun and all associated payslips have been marked as Paid and archived.",
    });
  } catch (error: any) {
    if (error instanceof PayrollDomainError) {
      return NextResponse.json({ success: false, error: error.message, code: error.code }, { status: error.status });
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
