export * from './types/attendance.types';
export * from './types/time-off.types';
export * from './services/attendance.service';
export * from './services/time-off-type.service';
export * from './services/allocation.service';
export * from './services/request.service';

import { prisma } from '@/lib/prisma';
import { AttendanceService } from './services/attendance.service';
import { AllocationService } from './services/allocation.service';

/**
 * Integration Adapter for Person 3 (Payroll Engine):
 * Returns approved time-off requests within a payroll period.
 */
export async function getApprovedLeavesForPeriod(
  employeeId: string,
  periodStart: Date,
  periodEnd: Date
) {
  return prisma.timeOffRequest.findMany({
    where: {
      employeeId,
      status: 'Approved',
      OR: [
        { startDate: { gte: periodStart, lte: periodEnd } },
        { endDate: { gte: periodStart, lte: periodEnd } },
        { startDate: { lte: periodStart }, endDate: { gte: periodEnd } },
      ],
    },
    include: {
      timeOffType: true,
    },
  });
}

/**
 * Integration Adapter for Person 3 (Payroll Engine):
 * Returns worked days and total worked hours for an employee within a payroll period.
 */
export async function getWorkedDaysForPeriod(
  employeeId: string,
  periodStart: Date,
  periodEnd: Date
) {
  const records = await prisma.attendance.findMany({
    where: {
      employeeId,
      checkIn: { gte: periodStart, lte: periodEnd },
      checkOut: { not: null },
    },
  });

  const totalWorkedHours = records.reduce((sum, r) => sum + Number(r.workedHours), 0);
  const uniqueWorkedDays = new Set(
    records.map((r) => new Date(r.checkIn).toISOString().slice(0, 10))
  ).size;

  return {
    workedDays: uniqueWorkedDays,
    totalWorkedHours: Math.round(totalWorkedHours * 100) / 100,
    recordsCount: records.length,
  };
}

/**
 * Integration Adapter for Person 4 (Dashboard):
 * Returns live attendance and leave metrics for dashboard aggregation (BR-DASH-001).
 */
export async function getDashboardOperationalMetrics() {
  const attendanceMetrics = await AttendanceService.getAttendanceMetrics();

  const totalApprovedLeaves = await prisma.timeOffRequest.aggregate({
    where: { status: 'Approved' },
    _sum: { duration: true },
    _count: true,
  });

  const pendingRequestsCount = await prisma.timeOffRequest.count({
    where: { status: 'Pending' },
  });

  const activeAllocationsCount = await prisma.timeOffAllocation.count({
    where: { status: 'Approved' },
  });

  return {
    attendance: attendanceMetrics,
    timeOff: {
      approvedLeaveDays: Number(totalApprovedLeaves._sum.duration || 0),
      approvedRequestsCount: totalApprovedLeaves._count,
      pendingRequestsCount,
      activeAllocationsCount,
    },
  };
}
