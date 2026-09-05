export interface CreateTimeOffTypeInput {
  name: string;
  unit: 'Days' | 'Hours';
  requiresAllocation?: boolean;
  requiresApproval?: boolean;
  affectsPayroll?: boolean;
  active?: boolean;
}

export interface UpdateTimeOffTypeInput {
  name?: string;
  unit?: 'Days' | 'Hours';
  requiresAllocation?: boolean;
  requiresApproval?: boolean;
  affectsPayroll?: boolean;
  active?: boolean;
}

export interface CreateAllocationInput {
  employeeId: string;
  timeOffTypeId: string;
  allocatedAmount: number;
  validFrom?: Date | string | null;
  validTo?: Date | string | null;
}

export interface AllocationFilter {
  employeeId?: string;
  timeOffTypeId?: string;
  status?: string; // Draft, Approved, Expired
}

export interface CreateTimeOffRequestInput {
  employeeId: string;
  timeOffTypeId: string;
  startDate: Date | string;
  endDate: Date | string;
  duration?: number; // In days or hours; auto-computed if omitted
  reason?: string | null;
  allocationId?: string | null;
}

export interface RequestFilter {
  employeeId?: string;
  departmentId?: string;
  timeOffTypeId?: string;
  status?: string; // Pending, Approved, Refused
  startDate?: Date | string;
  endDate?: Date | string;
}

export interface LeaveBalanceSummary {
  timeOffTypeId: string;
  timeOffTypeName: string;
  unit: string;
  totalAllocated: number;
  totalTaken: number;
  totalRemaining: number;
}
