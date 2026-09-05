import { NextRequest, NextResponse } from "next/server";
import { SalaryConfigurationService, PayrollDomainError } from "@/modules/payroll";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const structure = await SalaryConfigurationService.getStructure(id);
    if (!structure) {
      return NextResponse.json({ success: false, error: "Salary structure not found." }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: structure });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await req.json();
    const updated = await SalaryConfigurationService.updateStructure(id, body);
    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    if (error instanceof PayrollDomainError) {
      return NextResponse.json({ success: false, error: error.message, code: error.code }, { status: error.status });
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    await SalaryConfigurationService.deleteStructure(id);
    return NextResponse.json({ success: true, message: "Salary structure deleted successfully." });
  } catch (error: any) {
    if (error instanceof PayrollDomainError) {
      return NextResponse.json({ success: false, error: error.message, code: error.code }, { status: error.status });
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
