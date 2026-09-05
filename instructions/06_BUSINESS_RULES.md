# 06 — Business Rules

Every rule below is sourced from the PDF or the mockup flow description. No rule invents behavior beyond the source; where the source is silent on a detail, that detail is explicitly marked `[TEAM DECISION REQUIRED]` within the rule.

---

### BR-AUTH-001 — Login Gated by Active User
- **Title**: Only active users may authenticate.
- **Source**: `[MOCKUP REQUIREMENT]` (Flow 0)
- **Rule**: A `User` may log in only if their credentials are valid and `active = true`.
- **Trigger**: Login attempt.
- **Inputs**: work_email, password.
- **Expected behavior**: Valid + active → session created, routed by Role.
- **Failure behavior**: Invalid credentials or inactive user → login rejected.
- **Blocking**: Blocking.
- **Dependencies**: User Management (BR-AUTH-002).
- **Example**: A deactivated HR Manager account cannot log in even with correct password.

### BR-AUTH-002 — User ≠ Employee
- **Title**: Authentication accounts are distinct from HR employee records.
- **Source**: `[MOCKUP REQUIREMENT]`
- **Rule**: `User` (login/access) and `Employee` (HR master record) are separate entities. A `User` may optionally link to an `Employee`.
- **Trigger**: User creation/edit by Admin.
- **Expected behavior**: Admin can create a User and assign it an Employee and a Role independently.
- **Failure behavior**: N/A.
- **Blocking**: N/A (structural rule).
- **Dependencies**: Employees module, RBAC.
- **Example**: An Admin account may exist with no linked Employee profile (e.g., a system administrator who is not on payroll).

### BR-EMP-001 — Employee as Central Hub
- **Title**: Employee record must expose related-record navigation.
- **Source**: `[OFFICIAL REQUIREMENT]`
- **Rule**: The Employee Form must provide working navigation (smart buttons/links) to that employee's Contracts, Attendance, Time Off, and Allocations, each pre-filtered to that employee.
- **Trigger**: Opening an Employee Form.
- **Expected behavior**: Each related-record link opens a list scoped to `employee_id = current`.
- **Failure behavior**: A broken/unfiltered link is a defect.
- **Blocking**: N/A (UX/functional rule).
- **Example**: Clicking "Contracts (3)" on an employee's form opens exactly that employee's 3 contracts, not the global contract list.

### BR-CON-001 — Period-Applicable Contract Selection
- **Title**: Payroll must use the contract applicable to the selected period, never simply the latest contract.
- **Source**: `[OFFICIAL REQUIREMENT]`
- **Rule**: When computing a Payslip for a given period, the system must select the Contract whose `[start_date, end_date]` range covers that period for the given employee.
- **Trigger**: Payslip computation (Payrun → Compute).
- **Inputs**: employee_id, payrun period_start/period_end.
- **Expected behavior**: Exactly one applicable Contract is found and used; its wage, working schedule, and salary structure context feed into computation.
- **Failure behavior**: If zero applicable contracts are found → raise a `missing_contract` PayrollWarning (see BR-PSL-003) and do not silently substitute the "latest" contract.
- **Blocking**: `[TEAM DECISION REQUIRED]` — whether missing-contract blocks Payslip computation for that employee or produces a zero/flagged Payslip.
- **Dependencies**: Contract module.
- **Example**: Employee had Contract A (Jan–Jun) and Contract B (Jul–Dec). A Payrun for August must resolve Contract B, even if Contract A was created more recently in the system's edit history.

### BR-CON-002 — Overlapping Contract Detection
- **Title**: Concurrent active contracts for the same period are a payroll issue.
- **Source**: `[OFFICIAL REQUIREMENT]`
- **Rule**: If more than one Contract for the same employee has overlapping date ranges and both are in a state considered "active," this must be surfaced as a warning/attention item.
- **Trigger**: Contract save; Payrun compute.
- **Expected behavior**: A `multiple_contracts` PayrollWarning is raised, referencing the employee and conflicting contracts.
- **Failure behavior**: N/A — this rule itself defines the failure/warning behavior.
- **Blocking**: `[TEAM DECISION REQUIRED]` — whether this blocks Payslip computation for that employee or is advisory only.
- **Example**: HR mistakenly activates a new contract before ending the old one; both cover the current payroll period → flagged before Payrun validation.

### BR-SCH-001 — Weekly Hours Are Always Calculated
- **Title**: Weekly hours are derived, never manually authoritative.
- **Source**: `[OFFICIAL REQUIREMENT]`
- **Rule**: `WorkingSchedule.weekly_hours` must be computed as the sum of each `WorkingScheduleDay`'s (end_time − start_time − break) values.
- **Trigger**: Any create/update to a WorkingScheduleDay.
- **Expected behavior**: `weekly_hours` recalculates automatically and is read-only to the user.
- **Failure behavior**: A stored manual override of `weekly_hours` is a defect.
- **Blocking**: Blocking (structural).
- **Example**: Editing Tuesday's end time from 17:00 to 18:00 increases weekly_hours by 1 immediately.

### BR-ATT-001 — Worked Hours Computation
- **Title**: Worked hours are computed from attendance check-in/check-out.
- **Source**: `[OFFICIAL REQUIREMENT]`
- **Rule**: `Attendance.worked_hours` is computed from `check_out − check_in` once both are recorded, compared against the employee's schedule expectations for status derivation.
- **Trigger**: Check-out recorded.
- **Expected behavior**: worked_hours populated; status (Present/Late/Absent) derived per rules `[TEAM DECISION REQUIRED]` for exact thresholds.
- **Failure behavior**: Missing check-out → worked_hours remains null/pending, flagged as an exception (VAL-ATT-001).
- **Blocking**: Non-blocking (informational exception).
- **Example**: Check-in 09:05, check-out 17:35 with a scheduled 09:00–17:30 day → worked_hours = 8.5, status = Late (exact late-threshold logic is `[TEAM DECISION REQUIRED]`).

### BR-ATT-002 — Correction Authorization
- **Title**: Manual attendance corrections are restricted.
- **Source**: `[OFFICIAL REQUIREMENT]`
- **Rule**: Only HR Manager role and above may edit an existing Attendance record's check-in/check-out/status after creation.
- **Trigger**: Attendance edit attempt.
- **Expected behavior**: Authorized roles succeed and the edit is stamped (`corrected_by`, `corrected_at`).
- **Failure behavior**: Employee role attempting correction is denied at both UI and API layers.
- **Blocking**: Blocking.
- **Example**: An Employee cannot alter their own late check-in; their HR Manager can, and the correction is logged.

### BR-LEAVE-001 — Allocation Requires Approval Before Use
- **Title**: Allocations must be approved before they can be consumed.
- **Source**: `[OFFICIAL REQUIREMENT]`
- **Rule**: A `TimeOffAllocation` in `Draft` status cannot be referenced by an approved `TimeOffRequest`.
- **Trigger**: TimeOffRequest approval attempt.
- **Expected behavior**: Only `Approved`-status Allocations contribute usable `remaining_amount`.
- **Failure behavior**: Attempting to approve a Request against a Draft Allocation is blocked.
- **Blocking**: Blocking.
- **Example**: A new joiner's annual-leave allocation must itself be approved by HR before the employee can have a leave request approved against it.

### BR-LEAVE-002 — Approval Consumes Allocation
- **Title**: Only approved requests consume leave balance.
- **Source**: `[OFFICIAL REQUIREMENT]`
- **Rule**: When a `TimeOffRequest` for a type requiring allocation transitions to `Approved`, the linked `TimeOffAllocation.taken_amount` increases by the request's duration and `remaining_amount` decreases correspondingly.
- **Trigger**: Request status change to Approved.
- **Expected behavior**: Balance updates atomically with the approval.
- **Failure behavior**: If `remaining_amount` would go negative, approval is blocked (VAL-LEAVE-001).
- **Blocking**: Blocking.
- **Example**: Employee has 5 days remaining, requests 3 days → approval succeeds, remaining becomes 2.

### BR-LEAVE-003 — Refusal Never Consumes Balance
- **Title**: Refused/rejected requests do not affect allocation.
- **Source**: `[OFFICIAL REQUIREMENT]`
- **Rule**: A `TimeOffRequest` transitioning to `Refused` must leave the linked `TimeOffAllocation` untouched.
- **Trigger**: Request status change to Refused.
- **Expected behavior**: No balance change.
- **Failure behavior**: Any balance mutation on refusal is a defect.
- **Blocking**: Blocking (structural correctness).
- **Example**: A refused 3-day request leaves the 5-day balance at 5, not 2.

### BR-PAY-001 — Two-Step Payrun Creation
- **Title**: Payrun creation is a two-step wizard; no record is created at Step 1.
- **Source**: `[OFFICIAL REQUIREMENT]`
- **Rule**: Clicking "New" opens a wizard. Step 1 collects Salary Structure + Period and, on "Continue," moves to Step 2 without creating any Payrun record. Step 2 filters/selects eligible employees; only "Create Payrun" actually persists the Payrun, scoped to the explicitly selected employees.
- **Trigger**: User clicks New / Continue / Create Payrun.
- **Expected behavior**: No Payrun row exists in the database until "Create Payrun" is clicked.
- **Failure behavior**: A Payrun record created at Step 1 (before employee selection) is a critical defect.
- **Blocking**: Blocking (structural).
- **Example**: User opens the wizard, picks "Regular Salary" + "August 2026," clicks Continue, then closes the browser without selecting employees — no Payrun should exist afterward.

### BR-PAY-002 — Payrun Lifecycle Enforcement
- **Title**: Payrun state transitions must follow Draft → Computed → Validated → Paid.
- **Source**: `[OFFICIAL REQUIREMENT]`
- **Rule**: Only the defined actions (Compute, Validate, Mark Paid) may transition state, each only from its valid predecessor state. See `08_PAYRUN_STATE_MACHINE.md` for the full diagram.
- **Trigger**: Action button click.
- **Expected behavior**: Valid transitions succeed; invalid ones (e.g., Mark Paid on a Draft Payrun) are rejected.
- **Failure behavior**: Rejected with an explanatory error; no state change.
- **Blocking**: Blocking.
- **Example**: "Mark Paid" is disabled/rejected until the Payrun has reached `Validated`.

### BR-PAY-003 — Warnings Surfaced Before Finalization
- **Title**: Payroll issues must be visible before a Payrun can be finalized.
- **Source**: `[OFFICIAL REQUIREMENT]`
- **Rule**: Missing bank details, duplicate payslips, and contract-attention items must be displayed on the Payrun Processing screen prior to Validate/Mark Paid.
- **Trigger**: Compute action / Validate attempt.
- **Expected behavior**: All open `PayrollWarning` rows for the Payrun's Payslips are listed.
- **Failure behavior**: `[TEAM DECISION REQUIRED]` whether unresolved warnings block Validate, or are advisory only.
- **Blocking**: `[TEAM DECISION REQUIRED]`.
- **Example**: A Payslip missing the employee's bank details is flagged before the batch can be marked Paid.

### BR-RULE-001 — Salary Rules Must Drive Payslip Generation
- **Title**: Rules are functionally executed, not decorative configuration.
- **Source**: `[OFFICIAL REQUIREMENT]`
- **Rule**: Every Payslip line must be the literal output of evaluating an active `SalaryRule` belonging to the Payrun's `SalaryStructure`, executed in ascending `sequence` order, with later rules able to reference the computed results of earlier rules (e.g., a percentage-based allowance computed off Basic).
- **Trigger**: Payrun Compute action.
- **Expected behavior**: Changing a rule's value or sequence and recomputing changes the resulting Payslip lines.
- **Failure behavior**: Hardcoded/static payslip amounts are a critical defect (see `15_AI_RULES.md` #7, #30).
- **Blocking**: Blocking (defines core correctness).
- **Example**: A "Transport Allowance" rule set to 10% of Basic, sequenced after the Basic rule, correctly reflects 10% of that employee's actual computed Basic amount.

### BR-PSL-001 — Payslip Computation Inputs
- **Title**: Payslip computation must combine the applicable contract, assigned structure, and sequenced rules.
- **Source**: `[OFFICIAL REQUIREMENT]`
- **Rule**: See `07_PAYROLL_ENGINE.md` for the full pipeline. Summary: applicable Contract (BR-CON-001) + Payrun's Salary Structure + that structure's active Salary Rules in sequence + worked days/approved leave where relevant.
- **Trigger**: Payrun Compute.
- **Expected behavior**: Deterministic, reproducible Payslip lines.
- **Failure behavior**: Missing any required input blocks computation for that employee and raises a warning.
- **Blocking**: Blocking.
- **Example**: See `07_PAYROLL_ENGINE.md` worked example.

### BR-PSL-002 — Duplicate Payslip Detection
- **Title**: An employee cannot have two Payslips in the same Payrun.
- **Source**: `[OFFICIAL REQUIREMENT]`
- **Rule**: (employee_id, payrun_id) must be unique.
- **Trigger**: Payslip creation during Compute.
- **Expected behavior**: Attempting a second Payslip for the same employee in the same Payrun is rejected/flagged as `duplicate_payslip`.
- **Failure behavior**: DB constraint violation surfaced as a warning to the user, not a silent failure.
- **Blocking**: Blocking.
- **Example**: If Compute is accidentally triggered twice, the second run must not create a duplicate row for any employee already present.

### BR-PSL-003 — Missing Contract Warning
- **Title**: An employee with no applicable contract for the period must be flagged.
- **Source**: `[OFFICIAL REQUIREMENT]` (implied directly by BR-CON-001's failure path)
- **Rule**: If BR-CON-001 resolves zero contracts for an employee/period, a `missing_contract` warning is raised for that employee within the Payrun.
- **Trigger**: Payrun Compute.
- **Expected behavior**: Warning listed on the Payrun Processing screen; employee's Payslip is either skipped or marked incomplete (`[TEAM DECISION REQUIRED]` which).
- **Blocking**: `[TEAM DECISION REQUIRED]`.
- **Example**: A newly added employee with no Contract yet is excluded from computation and flagged rather than silently computed with zero/garbage wage data.

### BR-DASH-001 — Dashboard Must Use Live Data
- **Title**: No static/mocked dashboard values.
- **Source**: `[OFFICIAL REQUIREMENT]`
- **Rule**: Every KPI, chart, and alert on the Payroll Dashboard must be computed at request time (or via a live-refreshed cache) from the underlying Employee/Contract/Payroll/Attendance/Time Off tables — never a hardcoded or seeded "for demo" value that doesn't update when underlying data changes.
- **Trigger**: Dashboard load / filter change.
- **Expected behavior**: Marking a Payrun Paid immediately changes "Total Net Salary Paid" on next Dashboard load.
- **Failure behavior**: Any static JSON/chart config not backed by a live query is a critical defect.
- **Blocking**: Blocking.
- **Example**: Filtering the Dashboard to "Engineering" department must recompute all KPIs/charts scoped to only that department's records.
