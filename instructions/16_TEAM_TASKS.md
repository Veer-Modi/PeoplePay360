# 16 — Team Task Breakdown (4 People, 24 Hours)

Priority tiers: **P0 = MUST WORK** for the demo to succeed · **P1 = IMPORTANT** but demo can survive without it · **P2 = NICE TO HAVE**.

---

## Person 1 — Core HR + Auth

**Responsibilities**
- Authentication (login/logout)
- User Management (Admin CRUD, Role assignment)
- RBAC enforcement (shared middleware/guard used by all other modules)
- Employees module (Kanban/List/Form, smart-button navigation)
- Contracts module (history, applicable-contract resolution service — BR-CON-001/002)
- Working Schedules module (day-based hours calculation — BR-SCH-001)

**Files/Modules owned**: `auth/*`, `users/*`, `rbac/*`, `employees/*`, `contracts/*`, `schedules/*`

**Dependencies**: None upstream; everyone else depends on Employee, Contract, and RBAC being available early.

**Deliverables**
- Working login for all 5 seed users with correct role-scoped access
- Employee CRUD + smart buttons functioning
- Contract history + period-applicable resolution function exposed as a reusable service (consumed by Person 3's Payroll Engine)
- Working Schedule with auto-calculated hours

**Critical business rules**: BR-AUTH-001, BR-AUTH-002, BR-EMP-001, BR-CON-001, BR-CON-002, BR-SCH-001

**Integration points**: Exposes `resolveApplicableContract(employee, period)` for Person 3; exposes RBAC guard/middleware for Persons 2–4.

**Test responsibility**: TC-AUTH-*, TC-RBAC-*, TC-EMP-*, TC-CON-*, TC-SCH-*

**Priority**: Auth + RBAC + Employee CRUD = P0. Full contract-overlap UX polish = P1. Working Schedule UI polish = P1.

---

## Person 2 — Attendance + Time Off

**Responsibilities**
- Attendance List/Form/Widget, worked-hours computation, correction authorization
- Time Off Types configuration
- Time Off Allocations (create, approve)
- Time Off Requests (submit, approve/refuse) + balance-deduction logic

**Files/Modules owned**: `attendance/*`, `time-off/*`

**Dependencies**: Employee module (Person 1), RBAC guard (Person 1).

**Deliverables**
- Check-in/check-out flow with computed worked hours
- Attendance correction restricted to HR Manager+
- Full Allocation → Request → Approval → Balance-deduction loop (Scenario 2 of the demo)

**Critical business rules**: BR-ATT-001, BR-ATT-002, BR-LEAVE-001, BR-LEAVE-002, BR-LEAVE-003

**Integration points**: Exposes approved-leave data to Person 3's Payroll Engine if leave affects payroll (per Time Off Type's payroll-integration flag); exposes attendance/leave data to Person 4's Dashboard.

**Test responsibility**: TC-ATT-*, TC-LEAVE-*

**Priority**: Attendance check-in/out + Time Off approval loop = P0. Attendance Widget polish, exception highlighting = P1. Overtime/manual-edit dashboard metrics = P2.

---

## Person 3 — Payroll

**Responsibilities**
- Salary Structures, Salary Rules (CRUD + sequencing)
- Payroll Engine (the calculation pipeline — `07_PAYROLL_ENGINE.md`)
- Payruns (two-step wizard, lifecycle state machine — `08_PAYRUN_STATE_MACHINE.md`)
- Payslips (computation, duplicate detection)
- Validation/warnings (missing contract, duplicate payslip, missing bank details)
- PDF generation
- Bulk email delivery

**Files/Modules owned**: `salary-structures/*`, `salary-rules/*`, `payroll-engine/*`, `payruns/*`, `payslips/*`, `pdf/*`, `email/*`

**Dependencies**: Contract resolution service (Person 1), Employee data (Person 1), Attendance/Leave data if payroll-integrated (Person 2).

**Deliverables**
- Functional rule engine supporting fixed/percentage/formula calculation types
- Working two-step Payrun wizard that creates no record at Step 1
- Full Draft → Computed → Validated → Paid lifecycle
- Payslip PDF generation and Payrun-level bulk email

**Critical business rules**: BR-PAY-001, BR-PAY-002, BR-PAY-003, BR-RULE-001, BR-PSL-001, BR-PSL-002, BR-PSL-003

**Integration points**: Consumes Person 1's contract-resolution service; exposes computed Payslip data to Person 4's Dashboard.

**Test responsibility**: TC-RULE-*, TC-ENGINE-*, TC-PAY-*, TC-PSL-*, TC-PDF-*, TC-EMAIL-*

**Priority**: Rule engine + Payrun lifecycle + Payslip computation = P0 (this is the heart of the demo). PDF generation = P0 (explicitly required for Scenario 1). Bulk email = P1 (nice if working live, but a well-tested "send" that logs rather than truly delivers is an acceptable P1 fallback if SMTP setup runs out of time — record this fallback in `18_DECISIONS.md` if used).

---

## Person 4 — Frontend + Integration + Dashboard

**Responsibilities**
- Top navigation and overall shell/UX
- Wiring all backend APIs into the actual UI screens (`10_UI_SCREEN_SPEC.md`)
- Payroll Dashboard (KPIs, charts, alerts, live data — BR-DASH-001)
- Cross-module flows (making sure Employee → Contract → Payrun → Payslip actually clicks through end-to-end in the UI)
- Demo UX polish (loading/empty/error states)

**Files/Modules owned**: `frontend/*`, `dashboard/*`

**Dependencies**: All other three people's APIs must exist (even as stubs early on) for integration to proceed — coordinate early on the `09_API_CONTRACT.md` shapes.

**Deliverables**
- All 30 screens in `10_UI_SCREEN_SPEC.md` wired to real data
- Working Payroll Dashboard with live filters
- Smooth click-through for both demo scenarios

**Critical business rules**: BR-DASH-001

**Integration points**: Consumes every other person's API; is the integration point that will surface any contract mismatches early — should validate against `09_API_CONTRACT.md` continuously.

**Test responsibility**: TC-DASH-*, TC-INT-*, TC-E2E-*

**Priority**: Navigation + Employee/Contract/Payrun/Payslip screens wired = P0. Dashboard with live KPIs = P0. Full chart polish and all attendance/time-off overview widgets = P1. Kanban drag-and-drop, advanced filtering = P2.

---

## Cross-Cutting Handoff Requirements

- Person 1 must expose the RBAC guard and `resolveApplicableContract()` service by early-to-mid hackathon so Persons 2 and 3 aren't blocked.
- Person 3's Payslip/Payrun API shapes should be drafted (even before full engine completion) so Person 4 can start wiring the UI in parallel using mock/stub responses matching `09_API_CONTRACT.md`.
- All four people must treat `09_API_CONTRACT.md` and `04_DATABASE_SCHEMA.md` as the shared contract — any deviation must be raised to the team immediately (per `15_AI_RULES.md` #24–25).
