# 13 — Seed Data Specification

All names below are fictional placeholders (`[IMPLEMENTATION DETAIL]`) intended to support the required demo scenarios (`[OFFICIAL REQUIREMENT]`). No real personal data is used.

## Departments
- Engineering
- Sales
- People Operations

## Working Schedules
- "Standard 40hr" — Mon–Fri, 09:00–17:30, 30 min break/day → weekly_hours = 40 (computed)
- "Part-Time 20hr" — Mon–Fri, 09:00–13:00, no break → weekly_hours = 20 (computed)

## Users & Roles

| Work Email | Role | Linked Employee |
|---|---|---|
| admin@peoplepay360.demo | Admin | — |
| hr.manager@peoplepay360.demo | HR Manager | Riya Kapoor |
| payroll.user@peoplepay360.demo | HR Payroll User | Karan Mehta |
| payroll.manager@peoplepay360.demo | HR Payroll Manager | Ananya Sinha |
| employee@peoplepay360.demo | Employee | Devansh Rao |

## Employees

| Name | Department | Job Position | Schedule | Status |
|---|---|---|---|---|
| Riya Kapoor | People Operations | HR Manager | Standard 40hr | Active |
| Karan Mehta | People Operations | Payroll Specialist | Standard 40hr | Active |
| Ananya Sinha | People Operations | Payroll Lead | Standard 40hr | Active |
| Devansh Rao | Engineering | Software Engineer | Standard 40hr | Active |
| Priya Nair | Sales | Sales Executive | Standard 40hr | Active (has historical contract — see below) |
| Aditya Verma | Engineering | QA Engineer | Part-Time 20hr | Active (used for missing-contract demo) |

## Contracts (Historical Demonstration)

| Employee | Start | End | Wage | Structure | Status |
|---|---|---|---|---|---|
| Priya Nair | 2025-01-01 | 2025-06-30 | 45,000 | Regular Salary | Expired |
| Priya Nair | 2025-07-01 | (open) | 52,000 | Regular Salary | Active |
| Devansh Rao | 2025-01-01 | (open) | 60,000 | Regular Salary | Active |
| Karan Mehta | 2025-01-01 | (open) | 50,000 | Regular Salary | Active |
| Ananya Sinha | 2025-01-01 | (open) | 65,000 | Regular Salary | Active |
| Riya Kapoor | 2025-01-01 | (open) | 55,000 | Regular Salary | Active |
| Aditya Verma | *(intentionally none)* | — | — | — | — (demonstrates missing-contract warning) |

## Salary Structure: "Regular Salary"

| Rule | Code | Category | Sequence | Type | Value |
|---|---|---|---|---|---|
| Basic Salary | BASIC | Basic | 1 | Fixed | = Contract.wage |
| Transport Allowance | TRANSPORT | Allowances | 2 | Percentage | 10% of BASIC |
| Gross Salary | GROSS | Gross | 3 | Formula | BASIC + TRANSPORT |
| Standard Deduction | DEDUCT | Deductions | 4 | Fixed | 1,000 |
| Net Salary | NET | Net | 5 | Formula | GROSS − DEDUCT |

`[TEAM DECISION]`: exact formula syntax/engine implementation per `07_PAYROLL_ENGINE.md`.

## Time Off Types
- "Annual Leave" — unit: Days, requires_allocation: true, requires_approval: true
- "Sick Leave" — unit: Days, requires_allocation: true, requires_approval: true
- "Unpaid Leave" — unit: Days, requires_allocation: false, requires_approval: true

## Allocations

| Employee | Type | Allocated | Taken | Remaining | Status |
|---|---|---|---|---|---|
| Devansh Rao | Annual Leave | 20 | 0 | 20 | Approved |
| Priya Nair | Annual Leave | 20 | 5 | 15 | Approved |
| Aditya Verma | Annual Leave | 20 | 0 | 20 | Approved |

## Time Off Requests

| Employee | Type | Dates | Duration | Status | Demo Purpose |
|---|---|---|---|---|---|
| Devansh Rao | Annual Leave | Next week, 3 days | 3 | Pending | Live approval demo (Scenario 2) |
| Priya Nair | Annual Leave | Past, 5 days | 5 | Approved | Shows balance already deducted |

## Attendance

- Devansh Rao: 10 days of check-in/check-out entries, mostly Present, 1 Late, 1 missing checkout (exception demo).
- Priya Nair: 10 days, all Present.

## Payruns / Payslips (Historical + Demo-Ready)

| Payrun | Period | Structure | Status | Employees | Purpose |
|---|---|---|---|---|---|
| "August 2025 Payroll" | Aug 2025 | Regular Salary | Paid | Riya, Karan, Ananya, Devansh, Priya | Historical record for Dashboard trend chart |
| "September 2026 Payroll" (draft, to run live) | Sep 2026 | Regular Salary | Draft | Riya, Karan, Ananya, Devansh, Priya, Aditya | Live demo target (Scenario 1); Aditya intentionally triggers a `missing_contract` warning since he has no contract |

## Demonstrated Conditions Checklist

- [x] Active employee (Devansh Rao)
- [x] Historical + active contract for same employee (Priya Nair)
- [x] Attendance records incl. one exception (Devansh Rao)
- [x] Pending leave request (Devansh Rao)
- [x] Approved leave request with balance already deducted (Priya Nair)
- [x] Allocation balance (all employees)
- [x] Salary structure + rules (Regular Salary)
- [x] Completed/Paid payrun (August 2025)
- [x] Dashboard metrics populated from the above (live-queried, not hardcoded)
- [x] Payroll warning example (Aditya Verma — missing contract)
