# 04 — Database Schema (Logical Design)

All entities below are required to support `[OFFICIAL REQUIREMENT]` / `[MOCKUP REQUIREMENT]` functionality. Entities not explicitly named in the source but necessary as supporting structures are marked `[IMPLEMENTATION DETAIL]`.

---

## User `[MOCKUP REQUIREMENT]`

| Field | Type | Required | Description | Default | Unique | FK |
|---|---|---|---|---|---|---|
| id | UUID/int | Yes | Primary key | — | Yes | — |
| work_email | string | Yes | Login identifier | — | Yes | — |
| password_hash | string | Yes | Hashed credential | — | No | — |
| employee_id | FK | `[TEAM DECISION REQUIRED]` | Link to Employee | null | No | Employee.id |
| role_id | FK | Yes | Assigned role | — | No | Role.id |
| active | boolean | Yes | Active/inactive status | true | No | — |
| created_at / updated_at | timestamp | Yes | Audit | now() | No | — |

Deletion behavior: soft-delete/deactivate only (`[TEAM DECISION REQUIRED]` for hard delete policy).

## Role `[MOCKUP REQUIREMENT]`

| Field | Type | Required | Description |
|---|---|---|---|
| id | int/enum | Yes | Primary key |
| name | enum | Yes | Employee / HR Manager / HR Payroll User / HR Payroll Manager / Admin |

`[IMPLEMENTATION DETAIL]`: may be implemented as a fixed enum rather than a table.

## Department `[IMPLEMENTATION DETAIL]` (implied by "department" field on Employee/Contract)

| Field | Type | Required | Description |
|---|---|---|---|
| id | UUID/int | Yes | Primary key |
| name | string | Yes | Department name |

## Employee `[OFFICIAL REQUIREMENT]`

| Field | Type | Required | Description | Default | Unique | FK |
|---|---|---|---|---|---|---|
| id | UUID/int | Yes | Primary key | — | Yes | — |
| full_name | string | Yes | Employee identity | — | No | — |
| work_email | string | `[TEAM DECISION REQUIRED]` | Contact/login link | — | `[TEAM DECISION REQUIRED]` | — |
| department_id | FK | `[TEAM DECISION REQUIRED]` | Department | null | No | Department.id |
| manager_id | FK (self) | No | Reporting manager | null | No | Employee.id |
| job_position | string | `[TEAM DECISION REQUIRED]` | Job title | null | No | — |
| working_schedule_id | FK | `[TEAM DECISION REQUIRED]` | Default schedule | null | No | WorkingSchedule.id |
| status | enum | Yes | Active/Inactive/Archived | Active | No | — |
| work_location | string | No `[MOCKUP REQUIREMENT]` | Location | null | No | — |
| company | string | `[TEAM DECISION REQUIRED]` | Company (multi-company not confirmed in scope) | null | No | — |

Deletion behavior: archive, not hard delete (preserves historical Contract/Payslip integrity).

## Contract `[OFFICIAL REQUIREMENT]`

| Field | Type | Required | Description | Default | FK |
|---|---|---|---|---|---|
| id | UUID/int | Yes | Primary key | — | — |
| employee_id | FK | Yes | Owning employee | — | Employee.id |
| department_id | FK | No | Department at time of contract | null | Department.id |
| job_position | string | No | Position | null | — |
| start_date | date | Yes | Contract start | — | — |
| end_date | date | No (open-ended allowed) | Contract end | null | — |
| wage | decimal | Yes | Base wage | — | — |
| working_schedule_id | FK | Yes | Schedule for this contract | — | WorkingSchedule.id |
| salary_structure_id | FK | Yes | Structure used for payroll | — | SalaryStructure.id |
| status | enum | Yes | Draft/Active/Expired/Cancelled | Draft | — |

Constraints: `[TEAM DECISION REQUIRED]` — whether the DB enforces non-overlap of Active contracts per employee via constraint, trigger, or application-layer validation only. Minimum requirement: application layer MUST detect overlap and raise a warning (see BR-CON-002); DB-level enforcement is an `[IMPLEMENTATION DETAIL]` optimization.

Index: (employee_id, start_date, end_date) for period lookups.

## WorkingSchedule `[OFFICIAL REQUIREMENT]`

| Field | Type | Required | Description |
|---|---|---|---|
| id | UUID/int | Yes | Primary key |
| name | string | Yes | Schedule name |
| type | string/enum | `[TEAM DECISION REQUIRED]` | Full-time/Part-time etc. |
| weekly_hours | decimal (computed) | Yes | Never manually authoritative; derived from WorkingScheduleDay rows |
| company | string | `[TEAM DECISION REQUIRED]` | If multi-company in scope |

## WorkingScheduleDay `[OFFICIAL REQUIREMENT]` (implements per-day pattern)

| Field | Type | Required | Description | FK |
|---|---|---|---|---|
| id | UUID/int | Yes | Primary key | — |
| working_schedule_id | FK | Yes | Parent schedule | WorkingSchedule.id |
| day_of_week | enum | Yes | Mon–Sun | — |
| start_time | time | Yes | Start | — |
| end_time | time | Yes | End | — |
| break_minutes | int | No | Break duration | — |
| computed_hours | decimal | Yes (derived) | (end − start) − break | — |

Deletion behavior: cascade delete with parent WorkingSchedule.

## Attendance `[OFFICIAL REQUIREMENT]`

| Field | Type | Required | Description | Default | FK |
|---|---|---|---|---|---|
| id | UUID/int | Yes | Primary key | — | — |
| employee_id | FK | Yes | Owning employee | — | Employee.id |
| check_in | timestamp | Yes | Check-in time | — | — |
| check_out | timestamp | No (nullable until checked out) | Check-out time | null | — |
| worked_hours | decimal (computed) | Yes | Derived | 0 | — |
| status | enum | Yes | Present/Late/Absent (per source) | — | — |
| corrected_by | FK | No | User who made a correction | null | User.id |
| corrected_at | timestamp | No | Correction timestamp | null | — |

Index: (employee_id, check_in).

## TimeOffType `[OFFICIAL REQUIREMENT]`

| Field | Type | Required | Description |
|---|---|---|---|
| id | UUID/int | Yes | Primary key |
| name | string | Yes | Type name |
| unit | enum | Yes | Days/Hours |
| requires_allocation | boolean | Yes | Whether balance tracking applies |
| requires_approval | boolean | Yes | Approval workflow toggle |
| affects_payroll | boolean | `[TEAM DECISION REQUIRED]` | Payroll integration flag |
| active | boolean | Yes | Active status |

## TimeOffAllocation `[OFFICIAL REQUIREMENT]`

| Field | Type | Required | Description | Default | FK |
|---|---|---|---|---|---|
| id | UUID/int | Yes | Primary key | — | — |
| employee_id | FK | Yes | Owner | — | Employee.id |
| time_off_type_id | FK | Yes | Type | — | TimeOffType.id |
| allocated_amount | decimal | Yes | Total granted | — | — |
| taken_amount | decimal (computed) | Yes | Sum of approved deductions | 0 | — |
| remaining_amount | decimal (computed) | Yes | allocated − taken | — | — |
| valid_from / valid_to | date | No | Validity window | null | — |
| status | enum | Yes | Draft/Approved/Expired | Draft | — |

Constraint: remaining_amount must never go negative (VAL-LEAVE-002).

## TimeOffRequest `[OFFICIAL REQUIREMENT]`

| Field | Type | Required | Description | Default | FK |
|---|---|---|---|---|---|
| id | UUID/int | Yes | Primary key | — | — |
| employee_id | FK | Yes | Requester | — | Employee.id |
| time_off_type_id | FK | Yes | Type | — | TimeOffType.id |
| allocation_id | FK | No (only if type requires allocation) | Linked allocation consumed | null | TimeOffAllocation.id |
| start_date / end_date | date | Yes | Leave period | — | — |
| duration | decimal | Yes | Computed from dates + unit | — | — |
| approver_id | FK | No | Approving user | null | User.id |
| status | enum | Yes | Pending/Approved/Refused | Pending | — |
| reason | text | No | Justification | null | — |

## SalaryStructure `[OFFICIAL REQUIREMENT]`

| Field | Type | Required | Description |
|---|---|---|---|
| id | UUID/int | Yes | Primary key |
| name | string | Yes | Structure name |
| active | boolean | Yes | Active status |

## SalaryRuleCategory `[OFFICIAL REQUIREMENT]` (implements "category" attribute)

| Field | Type | Required | Description |
|---|---|---|---|
| id | int/enum | Yes | Primary key |
| name | enum | Yes | Basic/Allowances/Gross/Deductions/Net |

`[IMPLEMENTATION DETAIL]`: may be a fixed enum instead of a table.

## SalaryRule `[OFFICIAL REQUIREMENT]`

| Field | Type | Required | Description | FK |
|---|---|---|---|---|
| id | UUID/int | Yes | Primary key | — |
| salary_structure_id | FK | Yes | Parent structure | SalaryStructure.id |
| name | string | Yes | Rule name | — |
| code | string | Yes | Unique short code within structure | — |
| category_id | FK | Yes | Category | SalaryRuleCategory.id |
| sequence | int | Yes | Execution order | — |
| calculation_type | enum | Yes | Fixed/Percentage/Formula | — |
| calculation_value | decimal/string | Yes | Amount, %, or formula expression | — |
| active | boolean | Yes | Active status | — |

Index: (salary_structure_id, sequence).

## Payrun `[OFFICIAL REQUIREMENT]`

| Field | Type | Required | Description | Default | FK |
|---|---|---|---|---|---|
| id | UUID/int | Yes | Primary key | — | — |
| name | string | Yes | Payrun label | — | — |
| salary_structure_id | FK | Yes | Structure scope | — | SalaryStructure.id |
| period_start / period_end | date | Yes | Payroll period | — | — |
| status | enum | Yes | Draft/Computed/Validated/Paid | Draft | — |
| created_by | FK | Yes | Creator | — | User.id |

## Payslip `[OFFICIAL REQUIREMENT]`

| Field | Type | Required | Description | FK |
|---|---|---|---|---|
| id | UUID/int | Yes | Primary key | — |
| payrun_id | FK | Yes | Parent Payrun | Payrun.id |
| employee_id | FK | Yes | Employee | Employee.id |
| contract_id | FK | Yes | Applicable contract used | Contract.id |
| salary_structure_id | FK | Yes | Structure used | SalaryStructure.id |
| period_start / period_end | date | Yes | Period (mirrors Payrun) | — |
| worked_days | decimal | Yes | From Attendance/Schedule | — |
| status | enum | Yes | Draft/Computed/Validated/Paid | — |
| gross_total | decimal (computed) | Yes | Sum of Gross-category lines | — |
| net_total | decimal (computed) | Yes | Sum of Net-category lines | — |

Uniqueness constraint: (employee_id, payrun_id) unique — prevents duplicate payslips per employee per Payrun (VAL-PSL-001).

## PayslipLine `[OFFICIAL REQUIREMENT]`

| Field | Type | Required | Description | FK |
|---|---|---|---|
| id | UUID/int | Yes | Primary key | — |
| payslip_id | FK | Yes | Parent payslip | Payslip.id |
| salary_rule_id | FK | Yes | Source rule | SalaryRule.id |
| category_id | FK | Yes | Category (denormalized from rule) | SalaryRuleCategory.id |
| sequence | int | Yes | Execution order (denormalized) | — |
| amount | decimal | Yes | Computed result | — |

## PayrollWarning `[IMPLEMENTATION DETAIL]` (supports BR-PAY-003 / dashboard alerts)

| Field | Type | Required | Description | FK |
|---|---|---|---|---|
| id | UUID/int | Yes | Primary key | — |
| payrun_id | FK | No | Related Payrun | Payrun.id |
| payslip_id | FK | No | Related Payslip | Payslip.id |
| type | enum | Yes | missing_bank_details / duplicate_payslip / missing_contract / multiple_contracts / incomplete_employee_data | — |
| severity | enum | `[TEAM DECISION REQUIRED]` | Blocking/Non-blocking | — |
| message | text | Yes | Human-readable description | — |
| resolved | boolean | Yes | Whether addressed | — |

## AuditLog `[TEAM DECISION REQUIRED]`

Whether an explicit audit log entity is needed beyond the fields above (e.g., `corrected_by`/`corrected_at` on Attendance, `approver_id` on TimeOffRequest) is not stated in the source. Recommend as `[IMPLEMENTATION RECOMMENDATION]` only if time allows.

---

## Critical Constraints Summary

1. A `Contract`'s effective date range must be checked against a `Payrun`'s period before it can be used for a `Payslip` — enforced in application logic (BR-CON-001).
2. `Payslip` uniqueness per (employee, payrun) is a hard DB constraint (VAL-PSL-001).
3. `TimeOffAllocation.remaining_amount` must never be negative — enforced in application logic at approval time (BR-LEAVE-002/003).
4. `WorkingSchedule.weekly_hours` is never written directly by a user — always recomputed from `WorkingScheduleDay` rows (BR-SCH-001).
5. Historical `Contract` and `Payslip` records are never hard-deleted once a Payrun reaches `Validated`/`Paid` status (see `15_AI_RULES.md` #19).