import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class EmployeeService {
  static async getAllEmployees() {
    return await prisma.employee.findMany({
      include: {
        department: true,
        manager: true,
        workingSchedule: true,
      },
    });
  }

  static async getEmployeeById(id: string) {
    return await prisma.employee.findUnique({
      where: { id },
      include: {
        department: true,
        manager: true,
        workingSchedule: true,
      },
    });
  }

  static async createEmployee(data: any) {
    return await prisma.employee.create({
      data,
    });
  }

  static async updateEmployee(id: string, data: any) {
    return await prisma.employee.update({
      where: { id },
      data,
    });
  }

  static async archiveEmployee(id: string) {
    return await prisma.employee.update({
      where: { id },
      data: { status: "Archived" },
    });
  }
}
