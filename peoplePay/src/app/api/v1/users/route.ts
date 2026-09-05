import { NextRequest } from "next/server";
import { PrismaClient } from "@prisma/client";
import { requireRole, jsonResponse, errorResponse } from "@/modules/auth/rbac";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// GET /api/v1/users - Admin only
export async function GET(request: NextRequest) {
  const rbac = await requireRole(["Admin"]);
  if (rbac.error) return jsonResponse(rbac, rbac.status);

  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        workEmail: true,
        active: true,
        role: true,
        employee: true,
        createdAt: true,
      }
    });
    return jsonResponse(users);
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

// POST /api/v1/users - Admin only
export async function POST(request: NextRequest) {
  const rbac = await requireRole(["Admin"]);
  if (rbac.error) return jsonResponse(rbac, rbac.status);

  try {
    const data = await request.json();
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.password, salt);

    const newUser = await prisma.user.create({
      data: {
        workEmail: data.workEmail,
        passwordHash,
        roleId: data.roleId,
        employeeId: data.employeeId,
      },
      select: {
        id: true,
        workEmail: true,
        role: true,
      }
    });

    return jsonResponse(newUser, 201);
  } catch (error: any) {
    return errorResponse(error.message, 400);
  }
}
