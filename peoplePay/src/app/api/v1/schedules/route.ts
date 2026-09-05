import { NextRequest } from "next/server";
import { ScheduleService } from "@/modules/core-hr/services/schedule.service";
import { requireRole, jsonResponse, errorResponse } from "@/modules/auth/rbac";

// GET /api/v1/schedules - HR Manager+
export async function GET(request: NextRequest) {
  const rbac = await requireRole(["HR Manager", "HR Payroll User", "HR Payroll Manager", "Admin"]);
  if (rbac.error) return jsonResponse(rbac, rbac.status);

  try {
    const schedules = await ScheduleService.getAllSchedules();
    return jsonResponse(schedules);
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

// POST /api/v1/schedules - HR Manager+
export async function POST(request: NextRequest) {
  const rbac = await requireRole(["HR Manager", "HR Payroll User", "HR Payroll Manager", "Admin"]);
  if (rbac.error) return jsonResponse(rbac, rbac.status);

  try {
    const data = await request.json();
    const newSchedule = await ScheduleService.createSchedule(data);
    return jsonResponse(newSchedule, 201);
  } catch (error: any) {
    return errorResponse(error.message, 400);
  }
}
