import { NextRequest } from "next/server";
import { EmployeeService } from "@/modules/core-hr/services/employee.service";
import { requireAuth, requireRole, jsonResponse, errorResponse } from "@/modules/auth/rbac";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAuth();
  if (auth.error) return jsonResponse(auth, auth.status);
  const { session } = auth;

  try {
    // If employee, can only read own ID
    if (session.user.roleName === "Employee" && session.user.employeeId !== params.id) {
      return errorResponse("Forbidden", 403);
    }

    const emp = await EmployeeService.getEmployeeById(params.id);
    if (!emp) return errorResponse("Not found", 404);
    
    return jsonResponse(emp);
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
