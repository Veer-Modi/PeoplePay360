import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const payslips = await prisma.payslip.findMany({
      include: {
        employee: true,
        payrun: true,
        salaryStructure: true,
      },
      orderBy: { periodStart: "desc" },
    });
    return NextResponse.json(payslips);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch payslips" }, { status: 500 });
  }
}
