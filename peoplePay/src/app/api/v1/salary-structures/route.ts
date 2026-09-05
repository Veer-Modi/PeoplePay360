import { NextRequest, NextResponse } from "next/server";
import { SalaryConfigurationService, PayrollDomainError } from "@/modules/payroll";

export async function GET() {
  try {
    const structures = await SalaryConfigurationService.listStructures();
    return NextResponse.json({ success: true, data: structures });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.name?.trim()) {
      return NextResponse.json({ success: false, error: "Salary structure name is required." }, { status: 400 });
    }
    const structure = await SalaryConfigurationService.createStructure(body.name, body.active ?? true);
    return NextResponse.json({ success: true, data: structure }, { status: 201 });
  } catch (error: any) {
    if (error instanceof PayrollDomainError) {
      return NextResponse.json({ success: false, error: error.message, code: error.code }, { status: error.status });
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
