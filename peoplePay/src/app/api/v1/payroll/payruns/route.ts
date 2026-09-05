import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { PayrunService } from "@/modules/payroll/payrun-service";
import { PrismaContractResolver, PrismaPayrollRepository } from "@/modules/payroll/adapters/prisma-payroll-repository";

const prisma = new PrismaClient();

const payrunService = new PayrunService(
  new PrismaPayrollRepository(),
  new PrismaContractResolver()
);

export async function GET() {
  try {
    const payruns = await prisma.payrun.findMany({
      include: {
        salaryStructure: true,
      },
      orderBy: { periodStart: "desc" },
    });
    return NextResponse.json(payruns);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch payruns" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // We expect { name, periodStart, periodEnd, salaryStructureId, employeeIds }
    const structure = await prisma.salaryStructure.findUnique({
      where: { id: body.salaryStructureId },
      include: { rules: true }
    });

    if (!structure) {
      return NextResponse.json({ error: "Salary structure not found" }, { status: 404 });
    }

    const payrunInput = {
      name: body.name,
      periodStart: new Date(body.periodStart),
      periodEnd: new Date(body.periodEnd),
      salaryStructure: {
        id: structure.id,
        name: structure.name,
        active: structure.active,
        rules: structure.rules.map(r => ({
          id: r.id,
          name: r.name,
          code: r.code,
          sequence: r.sequence,
          calculationType: r.calculationType as any,
          calculationValue: r.calculationValue,
          active: r.active,
          category: r.categoryId
        }))
      }
    };

    const newPayrun = await payrunService.createFromStepTwo(payrunInput, body.employeeIds);
    return NextResponse.json(newPayrun, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
