import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PayrollService } from "@/modules/payroll";

const payrollService = new PayrollService();

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const payrun = await payrollService.getPayrun(id);
    if (!payrun) {
      return NextResponse.json({ success: false, error: "Payrun not found." }, { status: 404 });
    }

    const [payslips, warnings, scopedEmployees] = await Promise.all([
      payrollService.getPayslips(id),
      prisma.payrollWarning.findMany({ where: { payrunId: id } }),
      prisma.payrunEmployee.findMany({
        where: { payrunId: id },
        include: { employee: true },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        payrun,
        employees: scopedEmployees.map((s) => s.employee),
        payslips,
        warnings,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
