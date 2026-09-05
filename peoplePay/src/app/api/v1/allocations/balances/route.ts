import { NextRequest, NextResponse } from 'next/server';
import { AllocationService } from '@/modules/time-tracking/services/allocation.service';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get('employeeId');

    if (!employeeId) {
      return NextResponse.json(
        { success: false, error: 'employeeId query parameter is required' },
        { status: 400 }
      );
    }

    const balances = await AllocationService.getEmployeeBalances(employeeId);
    return NextResponse.json({ success: true, data: balances });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
