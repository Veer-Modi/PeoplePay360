import { NextRequest, NextResponse } from 'next/server';
import { AttendanceService } from '@/modules/time-tracking/services/attendance.service';
import { prisma } from '@/lib/prisma';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const record = await prisma.attendance.findUnique({
      where: { id },
      include: {
        employee: { select: { id: true, fullName: true, workEmail: true, department: true } },
        correctedBy: { select: { id: true, workEmail: true, role: true } },
      },
    });

    if (!record) {
      return NextResponse.json({ success: false, error: 'Record not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: record });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    if (!body.correctedById) {
      return NextResponse.json(
        { success: false, error: 'correctedById is required for audit (BR-ATT-002)' },
        { status: 400 }
      );
    }

    const updated = await AttendanceService.correctAttendance({
      attendanceId: id,
      checkIn: body.checkIn,
      checkOut: body.checkOut,
      status: body.status,
      correctionReason: body.correctionReason || 'Manual adjustment by HR',
      correctedById: body.correctedById,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    const status = error.message?.includes('Forbidden') ? 403 : 400;
    return NextResponse.json({ success: false, error: error.message }, { status });
  }
}
