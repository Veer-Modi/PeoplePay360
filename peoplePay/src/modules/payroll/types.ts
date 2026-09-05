/** Domain types owned by the Payroll module. Persistence adapters map these to Prisma. */
export type DecimalValue = number;

export type PayrunStatus = "Draft" | "Computed" | "Validated" | "Paid";
export type PayslipStatus = PayrunStatus;
export type CalculationType = "Fixed" | "Percentage" | "Formula";

export interface SalaryRuleInput {
  id: string;
  name: string;
  code: string;
  sequence: number;
  calculationType: CalculationType;
  /** Fixed: numeric amount; Percentage: { percentage, baseRuleCode }; Formula: expression. */
  calculationValue: string;
  active: boolean;
  category: string;
}

export interface SalaryStructureInput {
  id: string;
  name: string;
  active: boolean;
  rules: SalaryRuleInput[];
}

export interface EmployeePayrollInput {
  id: string;
  fullName: string;
  workEmail?: string | null;
  bankDetailsPresent?: boolean;
}

export interface ApplicableContract {
  id: string;
  employeeId: string;
  wage: DecimalValue;
  salaryStructureId: string;
}

export interface PayrollPeriod {
  start: Date;
  end: Date;
}

export interface PayrunInput {
  id: string;
  name: string;
  period: PayrollPeriod;
  status: PayrunStatus;
  salaryStructure: SalaryStructureInput;
  employeeIds: string[];
}

export interface PayslipLineResult {
  salaryRuleId: string;
  ruleName: string;
  ruleCode: string;
  category: string;
  sequence: number;
  amount: DecimalValue;
}

export interface PayrollWarningResult {
  type: "missing_contract" | "multiple_contracts" | "duplicate_payslip" | "missing_bank_details";
  severity: "Blocking" | "Non-blocking";
  message: string;
  employeeId?: string;
}

export interface ComputedPayslip {
  employeeId: string;
  employeeName: string;
  employeeEmail?: string | null;
  contractId: string;
  salaryStructureId: string;
  period: PayrollPeriod;
  workedDays: DecimalValue;
  status: PayslipStatus;
  grossTotal: DecimalValue;
  netTotal: DecimalValue;
  lines: PayslipLineResult[];
  warnings: PayrollWarningResult[];
}

export interface ContractResolver {
  /** Implemented by Person 1's Contract service; never replace this with a latest-contract query. */
  getApplicableContracts(employeeId: string, period: PayrollPeriod): Promise<ApplicableContract[]>;
}

export interface PayrollRepository {
  getEmployee(employeeId: string): Promise<EmployeePayrollInput | null>;
  getWorkedDays(employeeId: string, period: PayrollPeriod): Promise<DecimalValue>;
  hasPayslip(payrunId: string, employeeId: string): Promise<boolean>;
  replaceComputedPayslips(payrunId: string, payslips: ComputedPayslip[]): Promise<void>;
  replaceWarnings(payrunId: string, warnings: PayrollWarningResult[]): Promise<void>;
  updatePayrunStatus(payrunId: string, status: PayrunStatus): Promise<void>;
  createPayrun(input: Omit<PayrunInput, "id" | "status">): Promise<PayrunInput>;
  getPayrun(id: string): Promise<PayrunInput | null>;
  getPayslips(payrunId: string): Promise<ComputedPayslip[]>;
}

export interface EmailGateway {
  send(message: { to: string; subject: string; body: string; attachment: Uint8Array; filename: string }): Promise<void>;
}
