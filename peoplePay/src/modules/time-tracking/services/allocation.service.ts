import { prisma } from '@/lib/prisma';
import { CreateAllocationInput, AllocationFilter, LeaveBalanceSummary } from '../types/time-off.types';
import { Prisma } from '@prisma/client';

export class AllocationService {
  /**
   * Create an Allocation in Draft status (BR-LEAVE-001)
   */
  static async createAllocation(input: CreateAllocationInput) {
    if (input.allocatedAmount <= 0) {
      throw new Error('Allocation amount must be greater than zero.');
    }

    const employee = await prisma.employee.findUnique({
      where: { id: input.employeeId },
    });
    if (!employee) throw new Error('Employee not found.');

    const timeOffType = await prisma.timeOffType.findUnique({
      where: { id: input.timeOffTypeId },
    });
    if (!timeOffType) throw new Error('Time off type not found.');

    const amount = new Prisma.Decimal(input.allocatedAmount);

    return prisma.timeOffAllocation.create({
      data: {
        employeeId: input.employeeId,
        timeOffTypeId: input.timeOffTypeId,
        allocatedAmount: amount,
        takenAmount: new Prisma.Decimal(0),
        remainingAmount: amount,
        validFrom: input.validFrom ? new Date(input.validFrom) : null,
        validTo: input.validTo ? new Date(input.validTo) : null,
        status: 'Draft',
      },
      include: {
        employee: { select: { id: true, fullName: true, workEmail: true } },
        timeOffType: true,
      },
    });
  }

  /**
   * Approve an Allocation (BR-LEAVE-001: Transitions from Draft to Approved)
   */
  static async approveAllocation(id: string, approverUserId?: string) {
    const allocation = await prisma.timeOffAllocation.findUnique({
      where: { id },
    });

    if (!allocation) {
      throw new Error('Allocation not found.');
    }

    if (allocation.status === 'Approved') {
      throw new Error('Allocation is already approved.');
    }

    // Verify approver role if provided
    if (approverUserId) {
      const approver = await prisma.user.findUnique({
        where: { id: approverUserId },
        include: { role: true },
      });
      if (!approver || !['HR Manager', 'Admin'].includes(approver.role.name)) {
        throw new Error('Forbidden: Only HR Manager and above may approve leave allocations.');
      }
    }

    return prisma.timeOffAllocation.update({
      where: { id },
      data: {
        status: 'Approved',
      },
      include: {
        employee: { select: { id: true, fullName: true, workEmail: true } },
        timeOffType: true,
      },
    });
  }

  /**
   * List and filter allocations
   */
  static async getAllocations(filter: AllocationFilter = {}) {
    const where: Prisma.TimeOffAllocationWhereInput = {};

    if (filter.employeeId) where.employeeId = filter.employeeId;
    if (filter.timeOffTypeId) where.timeOffTypeId = filter.timeOffTypeId;
    if (filter.status) where.status = filter.status;

    return prisma.timeOffAllocation.findMany({
      where,
      orderBy: { id: 'desc' },
      include: {
        employee: {
          select: {
            id: true,
            fullName: true,
            workEmail: true,
            jobPosition: true,
            department: { select: { name: true } },
          },
        },
        timeOffType: true,
      },
    });
  }

  /**
   * Get employee live leave balance summary across all leave types
   */
  static async getEmployeeBalances(employeeId: string): Promise<LeaveBalanceSummary[]> {
    const allocations = await prisma.timeOffAllocation.findMany({
      where: {
        employeeId,
        status: 'Approved',
      },
      include: {
        timeOffType: true,
      },
    });

    const balanceMap = new Map<string, LeaveBalanceSummary>();

    for (const alloc of allocations) {
      const typeId = alloc.timeOffTypeId;
      const existing = balanceMap.get(typeId);

      const allocated = Number(alloc.allocatedAmount);
      const taken = Number(alloc.takenAmount);
      const remaining = Number(alloc.remainingAmount);

      if (existing) {
        existing.totalAllocated += allocated;
        existing.totalTaken += taken;
        existing.totalRemaining += remaining;
      } else {
        balanceMap.set(typeId, {
          timeOffTypeId: typeId,
          timeOffTypeName: alloc.timeOffType.name,
          unit: alloc.timeOffType.unit,
          totalAllocated: allocated,
          totalTaken: taken,
          totalRemaining: remaining,
        });
      }
    }

    return Array.from(balanceMap.values());
  }

  /**
   * Find the active approved allocation for an employee and leave type
   */
  static async getUsableAllocation(employeeId: string, timeOffTypeId: string) {
    return prisma.timeOffAllocation.findFirst({
      where: {
        employeeId,
        timeOffTypeId,
        status: 'Approved',
        remainingAmount: { gt: 0 },
      },
      orderBy: { validFrom: 'asc' },
    });
  }
}
