import { NextRequest, NextResponse } from "next/server";
import { PayrollService, PayrollDomainError } from "@/modules/payroll";

const payrollService = new PayrollService();

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const pdfBytes = await payrollService.generatePayslipPdf(id);

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="payslip-${id}.pdf"`,
        "Content-Length": pdfBytes.length.toString(),
      },
    });
  } catch (error: any) {
    if (error instanceof PayrollDomainError) {
      return NextResponse.json({ success: false, error: error.message, code: error.code }, { status: error.status });
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
