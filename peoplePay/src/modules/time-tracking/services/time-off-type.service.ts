import { prisma } from '@/lib/prisma';
import { CreateTimeOffTypeInput, UpdateTimeOffTypeInput } from '../types/time-off.types';

export class TimeOffTypeService {
  /**
   * Create a new Time Off Policy Type (e.g., Annual Leave, Sick Leave)
   */
  static async createType(input: CreateTimeOffTypeInput) {
    if (!input.name || input.name.trim() === '') {
      throw new Error('Time off type name is required.');
    }

    return prisma.timeOffType.create({
      data: {
        name: input.name.trim(),
        unit: input.unit || 'Days',
        requiresAllocation: input.requiresAllocation ?? true,
        requiresApproval: input.requiresApproval ?? true,
        affectsPayroll: input.affectsPayroll ?? false,
        active: input.active ?? true,
      },
    });
  }

  /**
   * Update an existing Time Off Type
   */
  static async updateType(id: string, input: UpdateTimeOffTypeInput) {
    const existing = await prisma.timeOffType.findUnique({ where: { id } });
    if (!existing) {
      throw new Error('Time off type not found.');
    }

    return prisma.timeOffType.update({
      where: { id },
      data: {
        ...(input.name && { name: input.name.trim() }),
        ...(input.unit && { unit: input.unit }),
        ...(input.requiresAllocation !== undefined && { requiresAllocation: input.requiresAllocation }),
        ...(input.requiresApproval !== undefined && { requiresApproval: input.requiresApproval }),
        ...(input.affectsPayroll !== undefined && { affectsPayroll: input.affectsPayroll }),
        ...(input.active !== undefined && { active: input.active }),
      },
    });
  }

  /**
   * List all Time Off Types
   */
  static async getTypes(activeOnly = false) {
    return prisma.timeOffType.findMany({
      where: activeOnly ? { active: true } : {},
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { allocations: true, requests: true },
        },
      },
    });
  }

  /**
   * Get single Time Off Type by ID
   */
  static async getTypeById(id: string) {
    return prisma.timeOffType.findUnique({
      where: { id },
      include: {
        allocations: true,
      },
    });
  }
}
