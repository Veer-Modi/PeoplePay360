import { NextRequest, NextResponse } from 'next/server';
import { AllocationService } from '@/modules/time-tracking/services/allocation.service';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get('employeeId') || undefined;
    const timeOffTypeId = searchParams.get('timeOffTypeId') || undefined;
    const status = searchParams.get('status') || undefined;

    const allocations = await AllocationService.getAllocations({
      employeeId,
      timeOffTypeId,
      status,
    });

    return NextResponse.json({ success: true, data: allocations });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.employeeId || !body.timeOffTypeId || body.allocatedAmount === undefined) {
      return NextResponse.json(
        { success: false, error: 'employeeId, timeOffTypeId, and allocatedAmount are required' },
        { status: 400 }
      );
    }

    const allocation = await AllocationService.createAllocation({
      employeeId: body.employeeId,
      timeOffTypeId: body.timeOffTypeId,
      allocatedAmount: Number(body.allocatedAmount),
      validFrom: body.validFrom,
      validTo: body.validTo,
    });

    return NextResponse.json({ success: true, data: allocation }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
