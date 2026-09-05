import { PayrollDomainError } from "./errors";
import { computeEmployeePayslip } from "./payroll-engine";
import type { ComputedPayslip, ContractResolver, PayrollRepository, PayrollWarningResult, PayrunInput, PayrunStatus, SalaryStructureInput } from "./types";

export interface PayrunDraftStepOne { name: string; periodStart: Date; periodEnd: Date; salaryStructure: SalaryStructureInput; }

/** Step one is deliberately just an in-memory value: BR-PAY-001 forbids a DB record here. */
export function continuePayrunWizard(input: PayrunDraftStepOne): PayrunDraftStepOne {
  if (!input.name.trim()) throw new PayrollDomainError("Payrun name is required.", "invalid_payrun");
  if (input.periodEnd < input.periodStart) throw new PayrollDomainError("Period end must be on or after period start.", "invalid_period");
  if (!input.salaryStructure.active) throw new PayrollDomainError("Select an active salary structure.", "inactive_structure");
  return input;
}

export class PayrunService {
  constructor(private readonly repository: PayrollRepository, private readonly contracts: ContractResolver) {}

  async createFromStepTwo(stepOne: PayrunDraftStepOne, employeeIds: string[]): Promise<PayrunInput> {
    continuePayrunWizard(stepOne);
    if (employeeIds.length === 0) throw new PayrollDomainError("Select at least one employee.", "empty_employee_scope");
    return this.repository.createPayrun({ name: stepOne.name, period: { start: stepOne.periodStart, end: stepOne.periodEnd }, salaryStructure: stepOne.salaryStructure, employeeIds: [...new Set(employeeIds)] });
  }

  async compute(payrunId: string): Promise<{ payslips: ComputedPayslip[]; warnings: PayrollWarningResult[] }> {
    const payrun = await this.requirePayrun(payrunId);
    if (payrun.status !== "Draft" && payrun.status !== "Computed") throw this.invalidTransition(payrun.status, "Compute");
    const payslips: ComputedPayslip[] = [];
    const warnings: PayrollWarningResult[] = [];
    for (const employeeId of payrun.employeeIds) {
      const employee = await this.repository.getEmployee(employeeId);
      if (!employee) { warnings.push({ type: "missing_contract", severity: "Blocking", employeeId, message: "Employee no longer exists." }); continue; }
      const contracts = await this.contracts.getApplicableContracts(employeeId, payrun.period);
      if (contracts.length === 0) { warnings.push({ type: "missing_contract", severity: "Blocking", employeeId, message: `No applicable contract found for ${employee.fullName}.` }); continue; }
      if (contracts.length > 1) { warnings.push({ type: "multiple_contracts", severity: "Blocking", employeeId, message: `Multiple applicable contracts found for ${employee.fullName}.` }); continue; }
      if (await this.repository.hasPayslip(payrun.id, employeeId) && payrun.status !== "Computed") {
        warnings.push({ type: "duplicate_payslip", severity: "Blocking", employeeId, message: `A payslip already exists for ${employee.fullName}.` }); continue;
      }
      const payslip = computeEmployeePayslip({ payrun, employee, contract: contracts[0], workedDays: await this.repository.getWorkedDays(employeeId, payrun.period) });
      payslips.push(payslip,);
      warnings.push(...payslip.warnings);
    }
    // Adapter must make the replacement atomic so a failed compute never leaves partial data.
    await this.repository.replaceComputedPayslips(payrun.id, payslips);
    await this.repository.replaceWarnings(payrun.id, warnings);
    await this.repository.updatePayrunStatus(payrun.id, "Computed");
    return { payslips, warnings };
  }

  async validate(payrunId: string): Promise<void> { await this.transition(payrunId, "Computed", "Validated", "Validate"); }
  async markPaid(payrunId: string): Promise<void> { await this.transition(payrunId, "Validated", "Paid", "Mark paid"); }

  private async transition(payrunId: string, from: PayrunStatus, to: PayrunStatus, action: string): Promise<void> {
    const payrun = await this.requirePayrun(payrunId);
    if (payrun.status !== from) throw this.invalidTransition(payrun.status, action);
    if (to === "Validated" && (await this.repository.getPayslips(payrunId)).length === 0) throw new PayrollDomainError("A Payrun needs computed payslips before validation.", "no_payslips");
    await this.repository.updatePayrunStatus(payrunId, to);
  }
  private async requirePayrun(id: string): Promise<PayrunInput> { const value = await this.repository.getPayrun(id); if (!value) throw new PayrollDomainError("Payrun not found.", "payrun_not_found", 404); return value; }
  private invalidTransition(status: PayrunStatus, action: string) { return new PayrollDomainError(`${action} is not available while the Payrun is ${status}.`, "invalid_payrun_transition", 409); }
}
