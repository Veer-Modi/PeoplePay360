import { PrismaClient } from "@prisma/client";
import type { 
  PayrollRepository, 
  ContractResolver, 
  EmployeePayrollInput, 
  PayrollPeriod, 
  ApplicableContract,
  PayrunInput,
  PayrunStatus,
  ComputedPayslip,
  PayrollWarningResult
} from "../types";
import { ContractService } from "../../core-hr/services/contract.service";

const prisma = new PrismaClient();

export class PrismaContractResolver implements ContractResolver {
  async getApplicableContracts(employeeId: string, period: PayrollPeriod): Promise<ApplicableContract[]> {
    const contract = await ContractService.resolveApplicableContract(employeeId, period.start, period.end);
    if (!contract) return [];
    return [{
      id: contract.id,
      employeeId: contract.employeeId,
      wage: Number(contract.wage),
      salaryStructureId: contract.salaryStructureId
    }];
  }
}

export class PrismaPayrollRepository implements PayrollRepository {
  async getEmployee(employeeId: string): Promise<EmployeePayrollInput | null> {
    const emp = await prisma.employee.findUnique({ where: { id: employeeId } });
    if (!emp) return null;
    return {
      id: emp.id,
      fullName: emp.fullName,
      workEmail: emp.workEmail,
      bankDetailsPresent: true // Defaulting to true for hackathon
    };
  }

  async getWorkedDays(employeeId: string, period: PayrollPeriod): Promise<number> {
    // For simplicity, we just return a default of 20 days or calculate based on attendance
    return 20; 
  }

  async hasPayslip(payrunId: string, employeeId: string): Promise<boolean> {
    const count = await prisma.payslip.count({
      where: { payrunId, employeeId }
    });
    return count > 0;
  }

  async replaceComputedPayslips(payrunId: string, payslips: ComputedPayslip[]): Promise<void> {
    await prisma.$transaction(async (tx) => {
      await tx.payslipLine.deleteMany({ where: { payslip: { payrunId } } });
      await tx.payslip.deleteMany({ where: { payrunId } });

      for (const slip of payslips) {
        await tx.payslip.create({
          data: {
            payrunId,
            employeeId: slip.employeeId,
            contractId: slip.contractId,
            salaryStructureId: slip.salaryStructureId,
            periodStart: slip.period.start,
            periodEnd: slip.period.end,
            workedDays: slip.workedDays,
            status: slip.status,
            grossTotal: slip.grossTotal,
            netTotal: slip.netTotal,
            lines: {
              create: slip.lines.map(l => ({
                sequence: l.sequence,
                amount: l.amount,
                salaryRuleId: l.salaryRuleId,
                categoryId: l.category
              }))
            }
          }
        });
      }
    });
  }

  async replaceWarnings(payrunId: string, warnings: PayrollWarningResult[]): Promise<void> {
    await prisma.$transaction(async (tx) => {
      await tx.payrollWarning.deleteMany({ where: { payrunId } });
      if (warnings.length > 0) {
        await tx.payrollWarning.createMany({
          data: warnings.map(w => ({
            payrunId,
            type: w.type,
            severity: w.severity,
            message: w.message,
            resolved: false
          }))
        });
      }
    });
  }

  async updatePayrunStatus(payrunId: string, status: PayrunStatus): Promise<void> {
    await prisma.payrun.update({
      where: { id: payrunId },
      data: { status }
    });
    // Also update payslips
    await prisma.payslip.updateMany({
      where: { payrunId },
      data: { status }
    });
  }

  async createPayrun(input: Omit<PayrunInput, "id" | "status">): Promise<PayrunInput> {
    // In a real scenario, we need the creator ID.
    // For now, we fetch the first admin or HR user
    const user = await prisma.user.findFirst();
    
    const payrun = await prisma.payrun.create({
      data: {
        name: input.name,
        periodStart: input.period.start,
        periodEnd: input.period.end,
        status: "Draft",
        salaryStructureId: input.salaryStructure.id,
        createdById: user!.id,
      },
      include: { salaryStructure: { include: { rules: true } } }
    });

    return {
      id: payrun.id,
      name: payrun.name,
      period: { start: payrun.periodStart, end: payrun.periodEnd },
      status: payrun.status as PayrunStatus,
      salaryStructure: {
        id: payrun.salaryStructure.id,
        name: payrun.salaryStructure.name,
        active: payrun.salaryStructure.active,
        rules: payrun.salaryStructure.rules.map(r => ({
          id: r.id,
          name: r.name,
          code: r.code,
          sequence: r.sequence,
          calculationType: r.calculationType as any,
          calculationValue: r.calculationValue,
          active: r.active,
          category: r.categoryId
        }))
      },
      employeeIds: input.employeeIds
    };
  }

  async getPayrun(id: string): Promise<PayrunInput | null> {
    const payrun = await prisma.payrun.findUnique({
      where: { id },
      include: {
        salaryStructure: { include: { rules: true } },
        payslips: { select: { employeeId: true } }
      }
    });
    if (!payrun) return null;

    return {
      id: payrun.id,
      name: payrun.name,
      period: { start: payrun.periodStart, end: payrun.periodEnd },
      status: payrun.status as PayrunStatus,
      salaryStructure: {
        id: payrun.salaryStructure.id,
        name: payrun.salaryStructure.name,
        active: payrun.salaryStructure.active,
        rules: payrun.salaryStructure.rules.map(r => ({
          id: r.id,
          name: r.name,
          code: r.code,
          sequence: r.sequence,
          calculationType: r.calculationType as any,
          calculationValue: r.calculationValue,
          active: r.active,
          category: r.categoryId
        }))
      },
      employeeIds: payrun.payslips.map(p => p.employeeId)
    };
  }

  async getPayslips(payrunId: string): Promise<ComputedPayslip[]> {
    const slips = await prisma.payslip.findMany({
      where: { payrunId },
      include: {
        employee: true,
        lines: true,
        warnings: true
      }
    });

    return slips.map(slip => ({
      employeeId: slip.employeeId,
      employeeName: slip.employee.fullName,
      employeeEmail: slip.employee.workEmail,
      contractId: slip.contractId,
      salaryStructureId: slip.salaryStructureId,
      period: { start: slip.periodStart, end: slip.periodEnd },
      workedDays: Number(slip.workedDays),
      status: slip.status as PayslipStatus,
      grossTotal: Number(slip.grossTotal),
      netTotal: Number(slip.netTotal),
      lines: slip.lines.map(l => ({
        salaryRuleId: l.salaryRuleId,
        ruleName: "Unknown", // Simplification
        ruleCode: "UNK",
        category: l.categoryId,
        sequence: l.sequence,
        amount: Number(l.amount)
      })),
      warnings: slip.warnings.map(w => ({
        type: w.type as any,
        severity: w.severity as any,
        message: w.message,
        employeeId: slip.employeeId
      }))
    }));
  }
}
