import { NextRequest } from "next/server";
import { ContractService } from "@/modules/core-hr/services/contract.service";
import { requireRole, jsonResponse, errorResponse } from "@/modules/auth/rbac";

// GET /api/v1/contracts - Only HR Manager+
export async function GET(request: NextRequest) {
  const rbac = await requireRole(["HR Manager", "HR Payroll User", "HR Payroll Manager", "Admin"]);
  if (rbac.error) return jsonResponse(rbac, rbac.status);

  const { searchParams } = new URL(request.url);
  const employeeId = searchParams.get("employeeId");

  try {
    if (employeeId) {
      const contracts = await ContractService.getContractsByEmployee(employeeId);
      return jsonResponse(contracts);
    }
    const contracts = await ContractService.getAllContracts();
    return jsonResponse(contracts);
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

// POST /api/v1/contracts - HR Manager+
export async function POST(request: NextRequest) {
  const rbac = await requireRole(["HR Manager", "HR Payroll User", "HR Payroll Manager", "Admin"]);
  if (rbac.error) return jsonResponse(rbac, rbac.status);

  try {
    const data = await request.json();
    const newContract = await ContractService.createContract(data);
    return jsonResponse(newContract, 201);
  } catch (error: any) {
    return errorResponse(error.message, 400);
  }
}
