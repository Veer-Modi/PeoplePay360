# 01 — Product Requirements Document (PRD)

## 1. Product Overview

PeoplePay360 is an integrated HR & Payroll Operations Platform. `[OFFICIAL REQUIREMENT]` It connects Employee master data, Contracts, Working Schedules, Attendance, Time Off, Salary Structures/Rules, Payruns, Payslips, PDF/email delivery, and a live Payroll Dashboard into a single operational flow rather than a set of disconnected CRUD screens.

## 2. Problem Statement

`[OFFICIAL REQUIREMENT]` Most basic HR tools store employee details, attendance, leave, and salary data as separate, disconnected records. Real HR/payroll teams need these to work together: an employee may have multiple contracts over time and payroll must use the one applicable to the period; working hours come from an assigned schedule; attendance has exceptions needing review; leave balances depend on allocations and approvals; and payroll must transform all of this into understandable, validated payslips.

## 3. Goal

`[OFFICIAL REQUIREMENT]` Develop an integrated HR and payroll platform managing the full employee lifecycle — from master data and time tracking to payroll calculation and reporting.

## 4. Objectives (Key Outcomes)

`[OFFICIAL REQUIREMENT]`
- Unified HR flow: centralized employee records with navigation to Contracts, Attendance, and Time Off.
- Contract management: historical records preserved; payroll uses only the active, period-specific contract.
- Operational tracking: flexible Working Schedules, attendance tracking with exception handling, and Time Off (requests/allocations).
- Payroll processing: two-step Payrun workflow (scope/period → employee selection); payslips with clear breakdowns (Basic, Allowances, Deductions) and validation warnings.
- Reporting: a centralized Payroll Dashboard aggregating HR/Payroll data across Periods, Departments, and Employee types.

## 5. Users

`[OFFICIAL REQUIREMENT]` Employee, HR Manager, HR Payroll User, HR Payroll Manager, Admin. (Full permission matrix in `03_USER_ROLES_RBAC.md`.)

`[MOCKUP REQUIREMENT]` A separate concept of "User" (authentication account) exists distinct from "Employee" (HR master record). See Flow 0 in `02_FEATURE_SPEC.md`.

## 6. User Roles

See `03_USER_ROLES_RBAC.md` for the complete matrix. Summary:

| Role | Scope |
|---|---|
| Employee | Self-service only: own profile, attendance, leave balances, submit attendance/time-off requests |
| HR Manager | Full CRUD on Employees, Attendance, Contracts, Working Schedules, Time Off; approves/refuses leave; no payroll access |
| HR Payroll User | HR Manager permissions + Create/Read/Update Payruns & Payslips; read-only Salary Structures/Rules |
| HR Payroll Manager | HR Payroll User permissions + full CRUD on Payruns, Payslips, Salary Structures, Salary Rules |
| Admin | Full access to all modules/models, user management, role assignment, system administration |

## 7. Modules

`[OFFICIAL REQUIREMENT]`
1. Authentication & User Management `[MOCKUP REQUIREMENT]`
2. Employee Master Management
3. Contract Management
4. Working Schedule Setup
5. Attendance
6. Time Off (Types, Allocations, Requests)
7. Salary Structures
8. Salary Rules
9. Payruns
10. Payslips
11. Payslip PDF & Email Delivery
12. Payroll Dashboard

## 8. Functional Requirements

See `02_FEATURE_SPEC.md` for the full per-module breakdown, and `06_BUSINESS_RULES.md` for the enforceable rule set. High-level requirements (all `[OFFICIAL REQUIREMENT]` unless noted):

- REQ-EMP-001: Employee record acts as the central hub with Kanban, List, and Form views.
- REQ-CON-001: Multiple historical contracts per employee; payroll must resolve the contract applicable to the selected period; concurrent active contracts for the same period must be flagged.
- REQ-SCH-001: Weekly hours must be calculated automatically from a Day/Start/End/Break schedule definition, never entered manually as authoritative.
- REQ-ATT-001: Attendance list/form with Check In, Check Out, Worked Hours, Status; corrections restricted to authorized users.
- REQ-LEAVE-001: Time Off Types define policy; Allocations track balances; approved Requests consume allocation automatically.
- REQ-PAY-001: Two-step Payrun creation wizard (Step 1: Structure + Period → Step 2: employee selection); Payrun groups Payslips for a period.
- REQ-PSL-001: Payslip computation uses the applicable period contract + the Payrun's assigned Salary Structure + sequenced Salary Rules.
- REQ-DASH-001: Payroll Dashboard must show live (not static) KPIs, charts, alerts, and breakdowns, filterable by Period/Department/Employee Type.

## 9. End-to-End Flows

1. Employee → Contract → Working Schedule → Attendance → Time Off → Salary Structure/Rules → Payrun → Payslip → PDF/Email → Dashboard.
2. Time Off Type → Allocation → Request → Approval → Balance deduction.

Full flow detail: `17_DEMO_FLOW.md` and Feature Spec.

## 10. Business Goals

`[OFFICIAL REQUIREMENT]` Demonstrate real business logic (period-based contract validation, leave balance consumption, salary rule sequencing, payroll error detection) rather than surface-level UI; industry-standard architecture (RBAC, parent-child relationships, historical tracking, live analytics).

## 11. Scope

In scope: all modules listed in Section 7, role-based access control, a functional (not mocked) payroll rule engine, PDF generation, bulk email delivery, and a live dashboard — all as described in the PDF and the mockup flow description.

## 12. Out of Scope

`[TEAM DECISION REQUIRED]` unless later approved:
- Country-specific statutory tax computation
- Overtime law compliance logic
- Biometric/GPS/geofenced attendance
- Multi-company / multi-currency payroll
- Holiday calendar automation
- Any specific rounding standard

## 13. Acceptance Criteria

- All modules in Section 7 are functional and connected (not standalone CRUD screens).
- Payroll computation is driven by real Salary Rule sequencing — not hardcoded values.
- Contract resolution is period-aware, and overlapping active contracts are surfaced as warnings.
- Leave balance is correctly deducted only on approval.
- Payrun lifecycle (Draft → Computed → Validated → Paid) is enforced with no invalid transitions.
- Dashboard values are computed live from underlying records at request time.
- PDF payslips can be generated per employee; bulk email can be triggered from a Payrun.

## 14. Success Criteria

`[OFFICIAL REQUIREMENT]` A functional, seeded platform demoable in 5 minutes across at least two full end-to-end scenarios (employee→payslip, and leave allocation→request), plus a brief future-roadmap note.

## 15. Hackathon Deliverables

`[OFFICIAL REQUIREMENT]`
1. Functional platform populated with representative data.
2. Live 5-minute demo covering two end-to-end scenarios.
3. A brief future roadmap summary.

## 16. Traceability Matrix (Summary)

| Requirement ID | Feature Spec Module | Business Rule(s) | API | UI Screen | Test Case(s) |
|---|---|---|---|---|---|
| REQ-EMP-001 | Employees | BR-EMP-001 | `09_API_CONTRACT.md` §Employees | Employees Kanban/List/Form | TC-EMP-* |
| REQ-CON-001 | Contracts | BR-CON-001, BR-CON-002 | §Contracts | Contract List/Form | TC-CON-* |
| REQ-SCH-001 | Working Schedules | BR-SCH-001 | §Schedules | Working Schedule Form | TC-SCH-* |
| REQ-ATT-001 | Attendance | BR-ATT-001, BR-ATT-002 | §Attendance | Attendance List/Form/Widget | TC-ATT-* |
| REQ-LEAVE-001 | Time Off | BR-LEAVE-001..003 | §Time Off | Time Off Requests/Allocations/Types | TC-LEAVE-* |
| REQ-PAY-001 | Payruns | BR-PAY-001..003 | §Payruns | Payrun Wizard/Processing | TC-PAY-* |
| REQ-PSL-001 | Payslips | BR-PSL-001..003, BR-RULE-001 | §Payslips | Payslip Detail | TC-PSL-* |
| REQ-DASH-001 | Dashboard | BR-DASH-001 | §Dashboard | Payroll Dashboard | TC-DASH-* |

Full requirement-level traceability is maintained across `02_FEATURE_SPEC.md`, `06_BUSINESS_RULES.md`, `09_API_CONTRACT.md`, `10_UI_SCREEN_SPEC.md`, and `12_TEST_CASES.md`.