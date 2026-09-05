import { NextRequest, NextResponse } from 'next/server';
import { AttendanceService } from '@/modules/time-tracking/services/attendance.service';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));

    const attendance = await AttendanceService.checkOut({
      attendanceId: id,
      checkOut: body.checkOut,
    });

    return NextResponse.json({ success: true, data: attendance });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Check-out failed' },
      { status: 400 }
    );
  }
}
