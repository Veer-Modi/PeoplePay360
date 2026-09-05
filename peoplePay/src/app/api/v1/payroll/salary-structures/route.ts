import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const structures = await prisma.salaryStructure.findMany({
      include: {
        _count: {
          select: { rules: true, contracts: true }
        }
      }
    });
    return NextResponse.json(structures);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch salary structures" }, { status: 500 });
  }
}
