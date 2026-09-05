import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/modules/auth/authOptions";
import { prisma } from "@/lib/prisma";
import { PayrollService, SalaryConfigurationService, PayrollDomainError } from "@/modules/payroll";

const payrollService = new PayrollService();

export async function GET() {
  try {
    const payruns = await payrollService.listPayruns();
    return NextResponse.json({ success: true, data: payruns });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    let session: any = null;
    try {
      session = await getServerSession(authOptions);
    } catch {
      // Graceful fallback outside of Next.js HTTP server context (e.g. unit tests/scripts)
    }
    const body = await req.json();

    // Extract stepOne properties whether sent nested or flat
    const stepOneRaw = body.stepOne || body;
    const { name, periodStart, periodEnd } = stepOneRaw;
    const salaryStructureId = stepOneRaw.salaryStructureId || stepOneRaw.salaryStructure?.id;
    const employeeIds = body.employeeIds || [];

    if (!name?.trim()) {
      return NextResponse.json({ success: false, error: "Payrun name is required." }, { status: 400 });
    }
    if (!periodStart || !periodEnd) {
      return NextResponse.json({ success: false, error: "Period start and end dates are required." }, { status: 400 });
    }
    if (!salaryStructureId) {
      return NextResponse.json({ success: false, error: "Salary structure ID is required." }, { status: 400 });
    }
    if (!Array.isArray(employeeIds) || employeeIds.length === 0) {
      return NextResponse.json({ success: false, error: "Select at least one employee." }, { status: 400 });
    }

    const structure = await SalaryConfigurationService.getStructure(salaryStructureId);
    if (!structure) {
      return NextResponse.json({ success: false, error: "Salary structure not found." }, { status: 404 });
    }

    // Determine createdById: session user -> body createdById -> seed Payroll Manager fallback
    let createdById = session?.user?.id || body.createdById;
    if (!createdById) {
      const defaultManager = await prisma.user.findFirst({
        where: { workEmail: "payroll.manager@peoplepay360.demo" },
      });
      createdById = defaultManager?.id;
    }
    if (!createdById) {
      return NextResponse.json({ success: false, error: "A creating user is required." }, { status: 400 });
    }

    const payrun = await payrollService.createPayrun(
      {
        name: name.trim(),
        periodStart: new Date(periodStart),
        periodEnd: new Date(periodEnd),
        salaryStructure: structure,
      },
      employeeIds,
      createdById
    );

    return NextResponse.json({ success: true, data: payrun }, { status: 201 });
  } catch (error: any) {
    if (error instanceof PayrollDomainError) {
      return NextResponse.json({ success: false, error: error.message, code: error.code }, { status: error.status });
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
