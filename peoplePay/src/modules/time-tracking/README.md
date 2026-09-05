# Time Tracking & Leave Operations Module (Person 2)

## Overview
This module implements the **Attendance Tracking** and **Time Off Request Lifecycle** for the PeoplePay360 platform as defined in `PERSON_2_GUIDE.md` and `06_BUSINESS_RULES.md`.

## Core Guarantees

1. **BR-ATT-001: Automatic Worked Hours & Status Derivation**
   - Automatically computes decimal hours worked (`check_out - check_in`).
   - Compares check-in time against the employee's `WorkingScheduleDay` with a 15-minute grace threshold to set `Present` vs `Late`.
   - Missing check-outs are flagged as open exceptions (`VAL-ATT-001`).

2. **BR-ATT-002: Authorized Correction Auditing**
   - Only `HR Manager` and `Admin` users can modify attendance records.
   - Every modification recalculates worked hours and stamps `correctedById` and `correctedAt`.

3. **BR-LEAVE-001: Allocation Activation**
   - Allocations are created in `Draft` and cannot be consumed until approved by an HR Manager.

4. **BR-LEAVE-002: Atomic Leave Deduction**
   - Approval executes inside a strict relational Prisma transaction.
   - Atomically decreases `remainingAmount` and increases `takenAmount`.
   - Blocks over-allocation requests with `VAL-LEAVE-001: Insufficient leave balance`.

5. **BR-LEAVE-003: Zero Mutation on Refusal**
   - Refusing a request leaves the allocation balance completely untouched.

## Integration Adapters for Teammates

Import directly from `@/modules/time-tracking`:

```typescript
import {
  getApprovedLeavesForPeriod,
  getWorkedDaysForPeriod,
  getDashboardOperationalMetrics,
  AttendanceService,
  AllocationService,
  TimeOffRequestService,
} from '@/modules/time-tracking';
```

- **Person 3 (Payroll Engine)**:
  - `getApprovedLeavesForPeriod(employeeId, periodStart, periodEnd)`: Fetches approved leaves and flags unpaid deductions.
  - `getWorkedDaysForPeriod(employeeId, periodStart, periodEnd)`: Returns total worked days and total worked hours for an employee.

- **Person 4 (Dashboard)**:
  - `getDashboardOperationalMetrics()`: Provides live aggregated KPIs for attendance health and leave usage (BR-DASH-001).
