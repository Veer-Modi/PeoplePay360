import { NextRequest, NextResponse } from 'next/server';
import { AttendanceService } from '@/modules/time-tracking/services/attendance.service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.employeeId) {
      return NextResponse.json(
        { success: false, error: 'employeeId is required' },
        { status: 400 }
      );
    }

    const attendance = await AttendanceService.checkIn({
      employeeId: body.employeeId,
      checkIn: body.checkIn,
    });

    return NextResponse.json({ success: true, data: attendance }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Check-in failed' },
      { status: 400 }
    );
  }
}
