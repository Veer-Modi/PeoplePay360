# 12 — Test Cases

Priority: P0 = must pass for demo, P1 = important, P2 = nice to have.

## 1. Authentication

| ID | Title | Preconditions | Input | Steps | Expected Result | Priority |
|---|---|---|---|---|---|---|
| TC-AUTH-001 | Valid login | Active user exists | Correct email/password | Submit login | Redirect to role landing page | P0 |
| TC-AUTH-002 | Invalid password | Active user exists | Wrong password | Submit login | Error shown, no session | P0 |
| TC-AUTH-003 | Inactive user login | User exists, active=false | Correct credentials | Submit login | Rejected with inactive message | P1 |

## 2. RBAC

| ID | Title | Steps | Expected Result | Priority |
|---|---|---|---|---|
| TC-RBAC-001 | Employee cannot access Payruns | Log in as Employee, navigate to /payroll/payruns | Access denied / route hidden | P0 |
| TC-RBAC-002 | HR Manager cannot access Salary Structures | Log in as HR Manager, hit Salary Structures API directly | 403 returned | P0 |
| TC-RBAC-003 | HR Payroll User has read-only Salary Rules | Log in as HR Payroll User, attempt to edit a rule | 403 returned | P0 |
| TC-RBAC-004 | Employee sees only own attendance | Log in as Employee, GET /attendance | Only own records returned | P0 |

## 3. Employee

| ID | Title | Steps | Expected Result | Priority |
|---|---|---|---|---|
| TC-EMP-001 | Create employee | HR Manager creates employee with required fields | Employee saved, appears in list | P0 |
| TC-EMP-002 | Smart button navigation | Open Employee Form, click Contracts smart button | Filtered contract list for that employee only | P0 |

## 4. Contract

| ID | Title | Preconditions | Input | Steps | Expected Result | Priority |
|---|---|---|---|---|---|---|
| TC-CON-001 | Valid single contract | Employee exists | One contract, active | Create Payrun for covering period | Payslip resolves this contract | P0 |
| TC-CON-002 | Expired contract not used | Employee has expired contract only for period | Attempt Payrun for a later period | `missing_contract` warning raised | P0 |
| TC-CON-003 | Historical contracts preserved | Employee has 2 past contracts | View contract history | Both visible, active one highlighted | P0 |
| TC-CON-004 | Overlapping contracts flagged | Two active contracts with overlapping dates | Save second contract | Overlap warning shown (VAL-CON-001) | P0 |
| TC-CON-005 | No applicable contract | Employee has no contract for the period | Run Payrun including this employee | Employee flagged, no Payslip created | P0 |
| TC-CON-006 | Period-based selection over "latest" | Employee has Contract A (Jan-Jun) and B (Jul-Dec), B created first in DB | Payrun for March | Contract A resolved despite B's later creation | P0 |

## 5. Working Schedule

| ID | Title | Steps | Expected Result | Priority |
|---|---|---|---|---|
| TC-SCH-001 | Weekly hours auto-calculated | Define 5 days, 8hr each, no break | View schedule | weekly_hours = 40 | P0 |
| TC-SCH-002 | Weekly hours update on edit | Edit one day's end time +1hr | Reload schedule | weekly_hours increases by 1 | P0 |

## 6. Attendance

| ID | Title | Steps | Expected Result | Priority |
|---|---|---|---|---|
| TC-ATT-001 | Check-in/check-out worked hours | Check in 9:00, check out 17:00 | View attendance record | worked_hours = 8 | P0 |
| TC-ATT-002 | Missing checkout flagged | Check in only, no checkout | View attendance list | Row flagged as exception | P1 |
| TC-ATT-003 | Correction restricted | Employee attempts to edit own attendance | Submit edit | 403 rejected | P0 |
| TC-ATT-004 | HR Manager can correct | HR Manager edits an attendance entry | Submit edit | Saved, corrected_by/at stamped | P0 |

## 7. Time Off

| ID | Title | Preconditions | Steps | Expected Result | Priority |
|---|---|---|---|---|---|
| TC-LEAVE-001 | Sufficient balance approval | Allocation remaining=5, request=3 | Approve request | Approved, remaining becomes 2 | P0 |
| TC-LEAVE-002 | Insufficient balance blocks approval | Allocation remaining=2, request=3 | Attempt approve | Rejected with error (VAL-LEAVE-001) | P0 |
| TC-LEAVE-003 | Refusal doesn't affect balance | Allocation remaining=5, request=3 | Refuse request | Remaining stays 5 | P0 |
| TC-LEAVE-004 | Unapproved allocation can't be used | Allocation status=Draft | Attempt to approve a request against it | Rejected (VAL-LEAVE-003) | P1 |

## 8. Salary Structure

| ID | Title | Steps | Expected Result | Priority |
|---|---|---|---|---|
| TC-SS-001 | Structure lists correct rule count | Add 3 rules to a structure | View structure list | Rule count = 3 | P1 |

## 9. Salary Rules

| ID | Title | Steps | Expected Result | Priority |
|---|---|---|---|---|
| TC-RULE-001 | Fixed rule | Rule: fixed 30000 | Compute payslip | Line amount = 30000 | P0 |
| TC-RULE-002 | Percentage rule | Rule: 10% of BASIC (30000) | Compute payslip | Line amount = 3000 | P0 |
| TC-RULE-003 | Formula rule | Rule: BASIC + TRANSPORT | Compute payslip | Line amount = sum of both | P0 |
| TC-RULE-004 | Sequence respected | Rules defined out of insertion order but with sequence 1,2,3 | Compute payslip | Lines generated/evaluated in sequence order | P0 |

## 10. Payroll Engine

| ID | Title | Steps | Expected Result | Priority |
|---|---|---|---|---|
| TC-ENGINE-001 | Deterministic recompute | Compute a Payrun twice with unchanged inputs | Compare results | Identical line amounts both times | P0 |
| TC-ENGINE-002 | Missing employee info surfaced | Employee missing bank details | Compute | `missing_bank_details` warning raised | P1 |

## 11. Payrun

| ID | Title | Steps | Expected Result | Priority |
|---|---|---|---|---|
| TC-PAY-001 | Two-step wizard, no premature record | Open New wizard, fill Step 1, click Continue, abandon | Query DB for Payruns | No Payrun record exists | P0 |
| TC-PAY-002 | Create Payrun persists scoped employees | Complete Step 2 with 3 employees selected | Create Payrun | Payrun exists with exactly those 3 employees | P0 |
| TC-PAY-003 | Compute → Computed | Payrun in Draft | Click Compute | Status becomes Computed, Payslips generated | P0 |
| TC-PAY-004 | Invalid transition rejected | Payrun in Draft | Attempt Mark Paid directly | Rejected (VAL-PAY-003) | P0 |
| TC-PAY-005 | Validate → Validated | Payrun in Computed | Click Validate | Status becomes Validated | P0 |
| TC-PAY-006 | Mark Paid → Paid | Payrun in Validated | Click Mark Paid | Status becomes Paid, Payslips marked Paid | P0 |

## 12. Payslip

| ID | Title | Steps | Expected Result | Priority |
|---|---|---|---|---|
| TC-PSL-001 | Duplicate payslip prevented | Payslip already exists for employee in Payrun | Attempt to recompute/create again | Duplicate rejected/flagged (VAL-PSL-001) | P0 |
| TC-PSL-002 | Payslip breakdown displays correctly | Open computed Payslip | View detail screen | Basic/Allowances/Gross/Deductions/Net all shown | P0 |

## 13. PDF

| ID | Title | Steps | Expected Result | Priority |
|---|---|---|---|---|
| TC-PDF-001 | Print payslip | Open a computed Payslip, click Print Payslip | PDF generated | PDF line items match Payslip lines exactly | P0 |

## 14. Email

| ID | Title | Steps | Expected Result | Priority |
|---|---|---|---|---|
| TC-EMAIL-001 | Bulk send from Payrun | Payrun with 3 payslips, click Send Payslips | 3 emails dispatched | Each with correct employee's payslip attached | P1 |

## 15. Dashboard

| ID | Title | Steps | Expected Result | Priority |
|---|---|---|---|---|
| TC-DASH-001 | Live KPI update | Mark a Payrun Paid | Reload Dashboard | Total Net Salary Paid reflects new total | P0 |
| TC-DASH-002 | Filter by department | Apply Department filter | View KPIs/charts | Only that department's data shown | P1 |
| TC-DASH-003 | No static data | Compare two different data states with same filters | Values differ | Dashboard is not returning a fixed/mocked payload | P0 |

## 16. Integration

| ID | Title | Steps | Expected Result | Priority |
|---|---|---|---|---|
| TC-INT-001 | Contract change mid-history reflected in payroll | Employee gets new contract with new wage | Run Payrun for new period | New wage used, old Payslips for prior periods unchanged | P0 |
| TC-INT-002 | Approved leave shown on Dashboard | Approve a leave request | Reload Dashboard | Approved Time Off KPI increments | P1 |

## 17. End-to-End

| ID | Title | Steps | Expected Result | Priority |
|---|---|---|---|---|
| TC-E2E-001 | Employee → Contract → Attendance → Payrun → Payslip | Full flow per `17_DEMO_FLOW.md` Scenario 1 | Payslip correctly generated and printable | P0 |
| TC-E2E-002 | Allocation → Request → Approval → Balance deduction | Full flow per `17_DEMO_FLOW.md` Scenario 2 | Balance correctly deducted only on approval | P0 |
