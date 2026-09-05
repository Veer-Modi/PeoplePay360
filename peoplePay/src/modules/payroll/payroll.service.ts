import { PayrollDomainError } from "./errors";
import { sendPayslips } from "./email-service";
import { personOneContractResolver } from "./person-1-2-adapters";
import { generatePayslipPdf } from "./pdf-service";
import { PrismaPayrollRepository } from "./prisma-payroll.repository";
import { PayrunService, type PayrunDraftStepOne } from "./payrun-service";
import type { EmailGateway } from "./types";

/**
 * The application-facing Person 3 service. API/UI owners can call this class
 * without duplicating Payroll Engine, PDF, or email workflow logic.
 */
export class PayrollService {
  private readonly repository = new PrismaPayrollRepository();
  private readonly payruns = new PayrunService(this.repository, personOneContractResolver);

  createPayrun(stepOne: PayrunDraftStepOne, employeeIds: string[], createdById: string) {
    return this.payruns.createFromStepTwo(stepOne, employeeIds, createdById);
  }

  computePayrun(payrunId: string) { return this.payruns.compute(payrunId); }
  validatePayrun(payrunId: string) { return this.payruns.validate(payrunId); }
  markPayrunPaid(payrunId: string) { return this.payruns.markPaid(payrunId); }
  getPayrun(payrunId: string) { return this.repository.getPayrun(payrunId); }
  listPayruns() { return this.repository.listPayruns(); }
  getPayslips(payrunId: string) { return this.repository.getPayslips(payrunId); }
  listPayslips(filter?: { payrunId?: string; employeeId?: string; status?: string }) { return this.repository.listPayslips(filter); }
  getPayslip(id: string) { return this.repository.getPayslip(id); }

  async generatePayslipPdf(payslipId: string): Promise<Uint8Array> {
    const payslip = await this.repository.getPayslip(payslipId);
    if (!payslip) throw new PayrollDomainError("Payslip not found.", "payslip_not_found", 404);
    return generatePayslipPdf(payslip);
  }

  async sendPayrunPayslips(payrunId: string, gateway: EmailGateway) {
    const payrun = await this.repository.getPayrun(payrunId);
    if (!payrun) throw new PayrollDomainError("Payrun not found.", "payrun_not_found", 404);
    if (!["Computed", "Validated", "Paid"].includes(payrun.status)) {
      throw new PayrollDomainError("Payslips must be computed before they can be sent.", "invalid_payrun_transition", 409);
    }
    return sendPayslips(await this.repository.getPayslips(payrunId), gateway);
  }
}
