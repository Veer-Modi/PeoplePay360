import { NextRequest, NextResponse } from "next/server";
import { PayrollService, PayrollDomainError, type EmailGateway } from "@/modules/payroll";

const payrollService = new PayrollService();

// Standard simulated/logged email gateway for hackathon demo per DEC-009 fallback
const demoEmailGateway: EmailGateway = {
  async send({ to, subject, filename, attachment }) {
    console.log(`[EMAIL DISPATCH] Sent to: ${to} | Subject: "${subject}" | Attachment: ${filename} (${attachment.length} bytes)`);
  },
};

export async function POST(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const result = await payrollService.sendPayrunPayslips(id, demoEmailGateway);
    return NextResponse.json({
      success: true,
      data: result,
      message: `Successfully dispatched ${result.sent} payslips. (${result.skipped.length} skipped due to missing email)`,
    });
  } catch (error: any) {
    if (error instanceof PayrollDomainError) {
      return NextResponse.json({ success: false, error: error.message, code: error.code }, { status: error.status });
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
