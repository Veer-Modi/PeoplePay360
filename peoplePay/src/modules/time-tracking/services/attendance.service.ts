import { prisma } from '@/lib/prisma';
import {
  CheckInInput,
  CheckOutInput,
  AttendanceCorrectionInput,
  AttendanceFilter,
  AttendanceStatus,
} from '../types/attendance.types';
import { Prisma } from '@prisma/client';

export class AttendanceService {
  /**
   * Calculate worked hours as decimal hours (e.g., 8.5)
   * BR-ATT-001: worked_hours = check_out - check_in
   */
  static calculateWorkedHours(checkIn: Date, checkOut: Date): number {
    const diffMs = checkOut.getTime() - checkIn.getTime();
    if (diffMs <= 0) return 0;
    const hours = diffMs / (1000 * 60 * 60);
    return Math.round(hours * 100) / 100;
  }

  /**
   * Determine attendance status based on check-in time and schedule
   */
  static determineStatus(checkIn: Date, scheduledStartTime?: Date | string | null): AttendanceStatus {
    if (!scheduledStartTime) {
      // Default: Consider standard 09:00 start if no schedule explicitly specified
      const hours = checkIn.getHours();
      const minutes = checkIn.getMinutes();
      if (hours > 9 || (hours === 9 && minutes > 15)) {
        return 'Late';
      }
      return 'Present';
    }

    let schedHour = 9;
    let schedMin = 0;

    if (scheduledStartTime instanceof Date) {
      schedHour = scheduledStartTime.getUTCHours();
      schedMin = scheduledStartTime.getUTCMinutes();
    } else if (typeof scheduledStartTime === 'string') {
      const parts = scheduledStartTime.split(':').map(Number);
      schedHour = parts[0] ?? 9;
      schedMin = parts[1] ?? 0;
    }

    const checkHour = checkIn.getHours();
    const checkMin = checkIn.getMinutes();

    const schedTotalMin = schedHour * 60 + schedMin;
    const checkTotalMin = checkHour * 60 + checkMin;

    // Grace period of 15 minutes
    if (checkTotalMin > schedTotalMin + 15) {
      return 'Late';
    }
    return 'Present';
  }

  /**
   * Check in an employee (Step 1 of daily attendance)
   */
  static async checkIn(input: CheckInInput) {
    const checkInDate = input.checkIn ? new Date(input.checkIn) : new Date();

    // Check if employee already has an open check-in today
    const existingOpen = await prisma.attendance.findFirst({
      where: {
        employeeId: input.employeeId,
        checkOut: null,
      },
      orderBy: { checkIn: 'desc' },
    });

    if (existingOpen) {
      throw new Error('Employee already has an active check-in session without check-out.');
    }

    // Retrieve employee and schedule for accurate status derivation
    const employee = await prisma.employee.findUnique({
      where: { id: input.employeeId },
      include: {
        workingSchedule: {
          include: { days: true },
        },
      },
    });

    if (!employee) {
      throw new Error('Employee not found.');
    }

    // Find schedule day if available
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDayName = dayNames[checkInDate.getDay()] || '';
    const daySchedule = employee.workingSchedule?.days.find(
      (d) =>
        d.dayOfWeek.toLowerCase() === currentDayName.toLowerCase() ||
        d.dayOfWeek.toLowerCase() === currentDayName.slice(0, 3).toLowerCase()
    );

    const status = this.determineStatus(checkInDate, daySchedule?.startTime);

    return prisma.attendance.create({
      data: {
        employeeId: input.employeeId,
        checkIn: checkInDate,
        status,
        workedHours: new Prisma.Decimal(0),
      },
      include: {
        employee: {
          select: { id: true, fullName: true, workEmail: true, department: true },
        },
      },
    });
  }

  /**
   * Check out an employee (BR-ATT-001: Computes worked hours)
   */
  static async checkOut(input: CheckOutInput) {
    const checkOutDate = input.checkOut ? new Date(input.checkOut) : new Date();

    const record = await prisma.attendance.findUnique({
      where: { id: input.attendanceId },
    });

    if (!record) {
      throw new Error('Attendance record not found.');
    }

    if (record.checkOut) {
      throw new Error('Check-out has already been recorded for this attendance entry.');
    }

    if (checkOutDate < record.checkIn) {
      throw new Error('Check-out time cannot be earlier than check-in time.');
    }

    const hours = this.calculateWorkedHours(record.checkIn, checkOutDate);

    return prisma.attendance.update({
      where: { id: input.attendanceId },
      data: {
        checkOut: checkOutDate,
        workedHours: new Prisma.Decimal(hours),
      },
      include: {
        employee: {
          select: { id: true, fullName: true, workEmail: true, department: true },
        },
      },
    });
  }

  /**
   * Quick check-out by employee ID (looks up latest active check-in)
   */
  static async checkOutByEmployee(employeeId: string, customCheckOut?: Date | string) {
    const active = await prisma.attendance.findFirst({
      where: {
        employeeId,
        checkOut: null,
      },
      orderBy: { checkIn: 'desc' },
    });

    if (!active) {
      throw new Error('No active check-in found for this employee.');
    }

    return this.checkOut({
      attendanceId: active.id,
      checkOut: customCheckOut,
    });
  }

  /**
   * Get active check-in session for an employee (for widget status)
   */
  static async getActiveCheckIn(employeeId: string) {
    return prisma.attendance.findFirst({
      where: {
        employeeId,
        checkOut: null,
      },
      orderBy: { checkIn: 'desc' },
    });
  }

  /**
   * Manual Attendance Correction (BR-ATT-002: Restricted to HR Manager/Admin with audit stamp)
   */
  static async correctAttendance(input: AttendanceCorrectionInput) {
    const record = await prisma.attendance.findUnique({
      where: { id: input.attendanceId },
    });

    if (!record) {
      throw new Error('Attendance record not found.');
    }

    // Verify corrector user role
    const corrector = await prisma.user.findUnique({
      where: { id: input.correctedById },
      include: { role: true },
    });

    if (!corrector) {
      throw new Error('Corrector user not found.');
    }

    const authorizedRoles = ['HR Manager', 'Admin', 'HR Payroll Manager'];
    if (!authorizedRoles.includes(corrector.role.name)) {
      throw new Error('Forbidden: Only HR Manager and above may edit attendance records (BR-ATT-002).');
    }

    const newCheckIn = input.checkIn ? new Date(input.checkIn) : record.checkIn;
    const newCheckOut =
      input.checkOut !== undefined
        ? input.checkOut
          ? new Date(input.checkOut)
          : null
        : record.checkOut;

    let workedHours = 0;
    if (newCheckIn && newCheckOut) {
      if (newCheckOut < newCheckIn) {
        throw new Error('Check-out time cannot be earlier than check-in time.');
      }
      workedHours = this.calculateWorkedHours(newCheckIn, newCheckOut);
    }

    return prisma.attendance.update({
      where: { id: input.attendanceId },
      data: {
        checkIn: newCheckIn,
        checkOut: newCheckOut,
        workedHours: new Prisma.Decimal(workedHours),
        status: input.status ?? record.status,
        correctedById: input.correctedById,
        correctedAt: new Date(),
      },
      include: {
        employee: {
          select: { id: true, fullName: true, workEmail: true, department: true },
        },
        correctedBy: {
          select: { id: true, workEmail: true, role: true },
        },
      },
    });
  }

  /**
   * List and filter attendance records (Screen 11)
   */
  static async getAttendanceList(filter: AttendanceFilter = {}) {
    const where: Prisma.AttendanceWhereInput = {};

    if (filter.employeeId) {
      where.employeeId = filter.employeeId;
    }

    if (filter.departmentId) {
      where.employee = { departmentId: filter.departmentId };
    }

    if (filter.status) {
      where.status = filter.status;
    }

    if (filter.exceptionsOnly) {
      where.checkOut = null; // VAL-ATT-001: missing check-out exception
    }

    if (filter.startDate || filter.endDate) {
      where.checkIn = {};
      if (filter.startDate) {
        where.checkIn.gte = new Date(filter.startDate);
      }
      if (filter.endDate) {
        where.checkIn.lte = new Date(filter.endDate);
      }
    }

    return prisma.attendance.findMany({
      where,
      orderBy: { checkIn: 'desc' },
      include: {
        employee: {
          select: {
            id: true,
            fullName: true,
            workEmail: true,
            jobPosition: true,
            department: { select: { id: true, name: true } },
          },
        },
        correctedBy: {
          select: { id: true, workEmail: true },
        },
      },
    });
  }

  /**
   * Get attendance summary metrics (Present, Late, Missing checkouts, Total hours)
   */
  static async getAttendanceMetrics(startDate?: Date, endDate?: Date) {
    const where: Prisma.AttendanceWhereInput = {};
    if (startDate || endDate) {
      where.checkIn = {};
      if (startDate) where.checkIn.gte = startDate;
      if (endDate) where.checkIn.lte = endDate;
    }

    const records = await prisma.attendance.findMany({ where });

    const presentCount = records.filter((r) => r.status === 'Present').length;
    const lateCount = records.filter((r) => r.status === 'Late').length;
    const missingCheckouts = records.filter((r) => r.checkOut === null).length;
    const totalHoursWorked = records.reduce((sum, r) => sum + Number(r.workedHours), 0);

    return {
      totalRecords: records.length,
      presentCount,
      lateCount,
      missingCheckouts,
      totalHoursWorked: Math.round(totalHoursWorked * 100) / 100,
    };
  }
}
