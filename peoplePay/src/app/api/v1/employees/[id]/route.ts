import { NextRequest } from "next/server";
import { EmployeeService } from "@/modules/core-hr/services/employee.service";
import { requireAuth, requireRole, jsonResponse, errorResponse } from "@/modules/auth/rbac";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const auth = await requireAuth();
  if (auth.error) return jsonResponse(auth, auth.status);
  const { session } = auth;

  try {
    // If employee, can only read own ID
    if (session.user.roleName === "Employee" && session.user.employeeId !== resolvedParams.id) {
      return errorResponse("Forbidden", 403);
    }

    const emp = await EmployeeService.getEmployeeById(resolvedParams.id);
    if (!emp) return errorResponse("Not found", 404);
    
    return jsonResponse(emp);
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
