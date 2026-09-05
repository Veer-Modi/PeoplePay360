export type AttendanceStatus = 'Present' | 'Late' | 'Absent';

export interface CheckInInput {
  employeeId: string;
  checkIn?: Date | string;
}

export interface CheckOutInput {
  attendanceId: string;
  checkOut?: Date | string;
}

export interface AttendanceCorrectionInput {
  attendanceId: string;
  checkIn?: Date | string;
  checkOut?: Date | string | null;
  status?: AttendanceStatus;
  correctionReason: string;
  correctedById: string; // Must be HR Manager or Admin
}

export interface AttendanceFilter {
  employeeId?: string;
  departmentId?: string;
  startDate?: Date | string;
  endDate?: Date | string;
  status?: string;
  exceptionsOnly?: boolean;
}

export interface AttendanceSummary {
  totalRecords: number;
  presentCount: number;
  lateCount: number;
  missingCheckouts: number;
  totalHoursWorked: number;
}
