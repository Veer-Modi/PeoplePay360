import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class ContractService {
  static async getAllContracts() {
    return await prisma.contract.findMany({
      include: {
        employee: true,
        department: true,
        workingSchedule: true,
        salaryStructure: true,
      },
      orderBy: { startDate: "desc" },
    });
  }

  static async getContractsByEmployee(employeeId: string) {
    return await prisma.contract.findMany({
      where: { employeeId },
      include: {
        department: true,
        workingSchedule: true,
        salaryStructure: true,
      },
      orderBy: { startDate: "desc" },
    });
  }

  static async createContract(data: any) {
    // BR-CON-002: Detect overlap
    const { employeeId, startDate, endDate } = data;
    
    // Convert to Date objects for comparison
    const targetStart = new Date(startDate);
    const targetEnd = endDate ? new Date(endDate) : null;

    const existingContracts = await prisma.contract.findMany({
      where: { employeeId, status: "Active" },
    });

    for (const contract of existingContracts) {
      const existingStart = new Date(contract.startDate);
      const existingEnd = contract.endDate ? new Date(contract.endDate) : null;

      // Check overlap
      const startsBeforeTargetEnds = !targetEnd || existingStart <= targetEnd;
      const endsAfterTargetStarts = !existingEnd || existingEnd >= targetStart;

      if (startsBeforeTargetEnds && endsAfterTargetStarts) {
        throw new Error("BR-CON-002: Overlapping active contract detected.");
      }
    }

    return await prisma.contract.create({
      data,
    });
  }

  // BR-CON-001: Resolve applicable contract for a payroll period
  static async resolveApplicableContract(employeeId: string, periodStart: Date, periodEnd: Date) {
    const contracts = await prisma.contract.findMany({
      where: { employeeId, status: { in: ["Active", "Expired"] } },
      orderBy: { startDate: "desc" },
    });

    for (const contract of contracts) {
      const contractStart = new Date(contract.startDate);
      const contractEnd = contract.endDate ? new Date(contract.endDate) : null;

      // The contract must have started on or before the period ends
      // And must end on or after the period starts (or have no end date)
      if (contractStart <= periodEnd && (!contractEnd || contractEnd >= periodStart)) {
        return contract;
      }
    }

    return null; // No applicable contract found
  }
}
