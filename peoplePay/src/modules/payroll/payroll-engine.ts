import { PayrollDomainError } from "./errors";
import { evaluateRule, validateRules, type RuleContext } from "./salary-rules";
import type { ApplicableContract, ComputedPayslip, EmployeePayrollInput, PayrunInput, PayrollWarningResult } from "./types";

const totalForCategory = (lines: ComputedPayslip["lines"], category: string) =>
  lines.filter((line) => line.category.toLowerCase() === category).reduce((sum, line) => sum + line.amount, 0);

export function computeEmployeePayslip(input: {
  payrun: PayrunInput;
  employee: EmployeePayrollInput;
  contract: ApplicableContract;
  workedDays: number;
}): ComputedPayslip {
  const { payrun, employee, contract, workedDays } = input;
  if (contract.salaryStructureId !== payrun.salaryStructure.id) {
    throw new PayrollDomainError("The applicable contract does not match the Payrun salary structure.", "structure_mismatch");
  }
  const context: RuleContext = {};
  const lines = validateRules(payrun.salaryStructure.rules).map((rule) => {
    const amount = evaluateRule(rule, context, contract.wage);
    context[rule.code] = amount;
    return { salaryRuleId: rule.id, ruleName: rule.name, ruleCode: rule.code, category: rule.category, sequence: rule.sequence, amount };
  });
  const warnings: PayrollWarningResult[] = employee.bankDetailsPresent === false
    ? [{ type: "missing_bank_details", severity: "Non-blocking", employeeId: employee.id, message: `${employee.fullName} has no bank details.` }]
    : [];
  return {
    employeeId: employee.id, employeeName: employee.fullName, employeeEmail: employee.workEmail, contractId: contract.id,
    salaryStructureId: payrun.salaryStructure.id, period: payrun.period, workedDays, status: "Computed",
    grossTotal: totalForCategory(lines, "gross"), netTotal: totalForCategory(lines, "net"), lines, warnings,
  };
}
