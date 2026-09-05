import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const rules = await prisma.salaryRule.findMany({
      include: {
        category: true,
      },
      orderBy: { sequence: "asc" }
    });
    return NextResponse.json(rules);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch salary rules" }, { status: 500 });
  }
}
