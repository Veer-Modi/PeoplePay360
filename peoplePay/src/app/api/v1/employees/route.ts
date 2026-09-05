import { NextRequest } from "next/server";
import { EmployeeService } from "@/modules/core-hr/services/employee.service";
import { requireAuth, requireRole, jsonResponse, errorResponse } from "@/modules/auth/rbac";

// GET /api/v1/employees - HR Manager+ can see all, Employee can see own
export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) return jsonResponse(auth, auth.status);
  const { session } = auth;

  try {
    if (session.user.roleName === "Employee") {
      if (!session.user.employeeId) return errorResponse("No employee record linked", 404);
      const emp = await EmployeeService.getEmployeeById(session.user.employeeId);
      return jsonResponse(emp ? [emp] : []);
    }

    // HR roles can see all
    const employees = await EmployeeService.getAllEmployees();
    return jsonResponse(employees);
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

// POST /api/v1/employees - Only HR Manager+ can create
export async function POST(request: NextRequest) {
  const rbac = await requireRole(["HR Manager", "HR Payroll User", "HR Payroll Manager", "Admin"]);
  if (rbac.error) return jsonResponse(rbac, rbac.status);

  try {
    const data = await request.json();
    const newEmployee = await EmployeeService.createEmployee(data);
    return jsonResponse(newEmployee, 201);
  } catch (error: any) {
    return errorResponse(error.message, 400);
  }
}
