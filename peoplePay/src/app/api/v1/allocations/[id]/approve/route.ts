import { NextRequest, NextResponse } from 'next/server';
import { AllocationService } from '@/modules/time-tracking/services/allocation.service';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));

    const approved = await AllocationService.approveAllocation(id, body.approverUserId);
    return NextResponse.json({ success: true, data: approved });
  } catch (error: any) {
    const status = error.message?.includes('Forbidden') ? 403 : 400;
    return NextResponse.json({ success: false, error: error.message }, { status });
  }
}
