import { ContractService } from "@/modules/core-hr/services/contract.service";
import { getApprovedLeavesForPeriod, getWorkedDaysForPeriod } from "@/modules/time-tracking";
import type { ApplicableContract, ContractResolver, PayrollPeriod } from "./types";

/**
 * Payroll's read-only integration with Person 1 and Person 2.
 * It consumes their published services and never writes to their entities.
 */
export const personOneContractResolver: ContractResolver = {
  async getApplicableContracts(employeeId: string, period: PayrollPeriod): Promise<ApplicableContract[]> {
    // Call the official BR-CON-001 resolver first. Contract history then lets payroll surface overlaps.
    const resolved = await ContractService.resolveApplicableContract(employeeId, period.start, period.end);
    const history = await ContractService.getContractsByEmployee(employeeId);
    const applicable = history.filter((contract) => {
      const startsBeforePeriodEnds = contract.startDate <= period.end;
      const endsAfterPeriodStarts = contract.endDate === null || contract.endDate >= period.start;
      return startsBeforePeriodEnds && endsAfterPeriodStarts && ["Active", "Expired"].includes(contract.status);
    });
    if (applicable.length > 0) {
      return applicable.map((contract) => ({
        id: contract.id,
        employeeId: contract.employeeId,
        wage: Number(contract.wage),
        salaryStructureId: contract.salaryStructureId,
      }));
    }
    return resolved ? [{ id: resolved.id, employeeId: resolved.employeeId, wage: Number(resolved.wage), salaryStructureId: resolved.salaryStructureId }] : [];
  },
};

export async function getPayrollAttendanceContext(employeeId: string, period: PayrollPeriod) {
  const [attendance, approvedLeave] = await Promise.all([
    getWorkedDaysForPeriod(employeeId, period.start, period.end),
    getApprovedLeavesForPeriod(employeeId, period.start, period.end),
  ]);
  return {
    workedDays: attendance.workedDays,
    totalWorkedHours: attendance.totalWorkedHours,
    approvedLeave: approvedLeave.map((request) => ({
      id: request.id,
      duration: Number(request.duration),
      affectsPayroll: request.timeOffType.affectsPayroll,
    })),
  };
}
