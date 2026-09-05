import { NextRequest, NextResponse } from 'next/server';
import { TimeOffTypeService } from '@/modules/time-tracking/services/time-off-type.service';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const type = await TimeOffTypeService.getTypeById(id);
    if (!type) {
      return NextResponse.json({ success: false, error: 'Type not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: type });
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
    const updated = await TimeOffTypeService.updateType(id, body);
    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
