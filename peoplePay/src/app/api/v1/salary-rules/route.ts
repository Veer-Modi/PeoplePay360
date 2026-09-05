import { NextRequest, NextResponse } from "next/server";
import { SalaryConfigurationService, PayrollDomainError } from "@/modules/payroll";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const salaryStructureId = searchParams.get("salaryStructureId") || undefined;
    const rules = await SalaryConfigurationService.listRules(salaryStructureId);
    return NextResponse.json({ success: true, data: rules });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { salaryStructureId, ...ruleData } = body;
    if (!salaryStructureId) {
      return NextResponse.json({ success: false, error: "salaryStructureId is required." }, { status: 400 });
    }
    const rule = await SalaryConfigurationService.addRule(salaryStructureId, ruleData);
    return NextResponse.json({ success: true, data: rule }, { status: 201 });
  } catch (error: any) {
    if (error instanceof PayrollDomainError) {
      return NextResponse.json({ success: false, error: error.message, code: error.code }, { status: error.status });
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
