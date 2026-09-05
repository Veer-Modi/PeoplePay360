# 11 — Validation Rules Catalog

| ID | Field/Entity | Condition | Error/Warning | Blocking? | User Message | Backend Behavior | Frontend Behavior |
|---|---|---|---|---|---|---|---|
| VAL-AUTH-001 | User.work_email/password | Invalid credentials | Error | Blocking | "Invalid email or password." | Reject login, no session | Show inline error |
| VAL-AUTH-002 | User.active | Inactive user attempts login | Error | Blocking | "This account is inactive." | Reject login | Show inline error |
| VAL-EMP-001 | Employee.work_email | Missing/duplicate | Error | Blocking (`[TEAM DECISION REQUIRED]` on required/unique scope) | "Work email is required / already in use." | Reject save | Field-level error |
| VAL-CON-001 | Contract (employee, dates) | Overlapping active contract for same employee/period | Warning | `[TEAM DECISION REQUIRED]` blocking vs. advisory | "This employee already has an active contract covering this period." | Raise PayrollWarning / reject save per team decision | Inline banner |
| VAL-CON-002 | Contract.end_date | end_date before start_date | Error | Blocking | "End date must be after start date." | Reject save | Field-level error |
| VAL-SCH-001 | WorkingScheduleDay | end_time before start_time | Error | Blocking | "End time must be after start time." | Reject save | Field-level error |
| VAL-ATT-001 | Attendance.check_out | Missing check-out after a defined period | Warning | Non-blocking | "This entry is missing a check-out." | Flag as exception, still visible in reporting | Highlight row |
| VAL-ATT-002 | Attendance edit | Non-HR-Manager+ attempts correction | Error | Blocking | "You are not authorized to edit this record." | Reject at API layer (403) | Disable edit controls |
| VAL-LEAVE-001 | TimeOffRequest approval | Requested duration exceeds Allocation.remaining_amount | Error | Blocking | "Insufficient leave balance for this request." | Reject approval | Inline error on Approve action |
| VAL-LEAVE-002 | TimeOffAllocation.remaining_amount | Would become negative | Error | Blocking | "This would result in a negative balance." | Reject the triggering operation | Inline error |
| VAL-LEAVE-003 | TimeOffAllocation.status | Request approval attempted against a Draft (unapproved) allocation | Error | Blocking | "Allocation must be approved before use." | Reject approval | Inline error |
| VAL-PAY-001 | Payrun creation | Step 2 submitted with zero employees selected | Error | Blocking | "Select at least one employee." | Reject Create Payrun | Disable Create button until ≥1 selected |
| VAL-PAY-002 | SalaryRule.sequence | Duplicate sequence within same structure | Warning/Error | `[TEAM DECISION REQUIRED]` | "Two rules share the same sequence number." | Flag or reject per team decision | Inline warning |
| VAL-PAY-003 | Payrun state transition | Action invoked from invalid state | Error | Blocking | "This action is not available in the current status." | Reject with 409 | Disable/hide button |
| VAL-PSL-001 | Payslip (employee, payrun) | Duplicate payslip for same employee in same Payrun | Error/Warning | Blocking (unique constraint) | "A payslip already exists for this employee in this payrun." | Reject creation, log as `duplicate_payslip` warning | Inline warning on Payrun Processing screen |
| VAL-PSL-002 | Payslip computation | No applicable contract found for employee/period | Warning | `[TEAM DECISION REQUIRED]` | "No applicable contract found for this employee." | Skip Payslip generation, raise `missing_contract` warning | Alert on Payrun Processing screen |
| VAL-PSL-003 | Payslip computation | Missing employee bank details | Warning | `[TEAM DECISION REQUIRED]` | "Missing bank details for this employee." | Raise `missing_bank_details` warning | Alert on Payrun Processing screen |
| VAL-PSL-004 | SalaryRule reference | Rule references a not-yet-computed rule (sequence violation) | Error | Blocking | "Configuration error: rule sequence dependency violated." | Reject computation, surface to HR Payroll Manager | Error banner |

## General Principle

A validation is only marked Blocking when the source (PDF/mockup) states or clearly implies mandatory enforcement (e.g., duplicate payslip, insufficient balance, unauthorized correction). Where the source is silent on blocking-vs-advisory, the validation is implemented as a visible warning by default and the blocking decision is escalated to `18_DECISIONS.md` as `[TEAM DECISION REQUIRED]` rather than assumed.
