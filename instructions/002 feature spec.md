# 02 — Feature Specification

Labels used: `[OFFICIAL REQUIREMENT]`, `[MOCKUP REQUIREMENT]`, `[TEAM DECISION]`, `[IMPLEMENTATION DETAIL]`, `[TEAM DECISION REQUIRED]`.

---

## Module: Authentication

**Purpose**: Allow internal users to log in and access the system according to role. `[MOCKUP REQUIREMENT]`

**Users**: All roles.

**Entities**: `User`

**Fields (mockup-derived)**: work email, password, active/inactive status, linked employee, role.

**Views**: Login screen.

**Actions**: Log in, log out.

**Relationships**: `User` optionally links to one `Employee`.

**Permissions**: Anyone with valid credentials and `active = true` may log in. Session/token mechanism: `[TEAM DECISION REQUIRED]`.

**Validations**: Invalid credentials rejected; inactive users blocked from login (`[TEAM DECISION REQUIRED]` on exact error UX).

**Workflows**: Login → route to workspace per role.

**Business rules**: BR-AUTH-001.

**Dependencies**: User Management module (to have accounts to log in with).

**Acceptance criteria**: A user with valid, active credentials can log in and see only the modules permitted by their role.

---

## Module: User Management

**Purpose**: Admin-controlled creation and management of authentication accounts, distinct from Employee HR records. `[MOCKUP REQUIREMENT]`

**Users**: Admin only (per Flow 0 mockup description: "User management is controlled by Admin").

**Entities**: `User`, `Role`

**Fields**: work email, linked Employee (optional/required — `[TEAM DECISION REQUIRED]` on whether every User must link to an Employee), role, active/inactive status.

**Views**: User list (with search, role filter), Create/Edit User form.

**Actions**: Create user, edit user, assign employee, assign role, activate/deactivate.

**Relationships**: `User` → `Employee` (0..1 or 1..1, see `[TEAM DECISION REQUIRED]` above), `User` → `Role` (1..1).

**Permissions**: Admin: full CRUD. All other roles: no access.

**Validations**: Work email required and unique; role required.

**Workflows**: Create/Edit User → Assign Employee → Assign Role → user gains module access per role.

**Business rules**: BR-AUTH-002 (User ≠ Employee distinction).

**Dependencies**: Employees module (for the employee-assignment dropdown), RBAC module.

**Acceptance criteria**: Admin can create a User, link it to an Employee, assign a Role, and that User's subsequent login is scoped to that Role's permissions.

---

## Module: Employees

**Purpose**: Central HR master record and operational hub for the platform. `[OFFICIAL REQUIREMENT]`

**Users**: HR Manager, HR Payroll User, HR Payroll Manager, Admin (full access); Employee (self, read-only + own attendance/leave submission).

**Entities**: `Employee`, `Department`

**Fields**: `[OFFICIAL REQUIREMENT]` identity, department, manager, working schedule, job position, status, work email; `[MOCKUP REQUIREMENT]` adds work location, company (exact field list beyond these is `[TEAM DECISION REQUIRED]`).

**Views**: Kanban, List, Form. `[OFFICIAL REQUIREMENT]`

**Actions**: Create, edit, archive/deactivate.

**Relationships**: Employee 1—N Contract; Employee 1—N Attendance; Employee 1—N TimeOffRequest; Employee 1—N TimeOffAllocation; Employee N—1 WorkingSchedule (default); Employee N—1 Department; Employee N—1 Manager (self-referencing to Employee).

**Permissions**: See `03_USER_ROLES_RBAC.md`.

**Validations**: Work email required/unique (`[TEAM DECISION REQUIRED]` on exact uniqueness scope); department/manager optional or required — `[TEAM DECISION REQUIRED]`.

**Workflows**: Employee Form provides smart-button navigation to related Contracts, Attendance, Time Off, Allocations. `[OFFICIAL REQUIREMENT]`

**Business rules**: BR-EMP-001.

**Dependencies**: Department, Manager (self-reference), Working Schedule.

**Acceptance criteria**: Opening an Employee Form shows identity/work info and provides working smart-button links to filtered Contract/Attendance/Time Off/Allocation views for that employee.

---

## Module: Contracts

**Purpose**: Maintain historical employment terms and determine the period-applicable contract for payroll. `[OFFICIAL REQUIREMENT]`

**Users**: HR Manager+ (CRUD); HR Payroll roles (read, as needed for payroll context).

**Entities**: `Contract`

**Fields**: employee, department, job position, start date, end date, wage, working schedule, salary structure, status. `[OFFICIAL REQUIREMENT]`

**Views**: List (dates, wage, status, active contract clearly highlighted), Form. `[OFFICIAL REQUIREMENT]`

**Actions**: Create, edit, view history.

**Relationships**: Contract N—1 Employee; Contract N—1 WorkingSchedule; Contract N—1 SalaryStructure.

**Permissions**: HR Manager and above: full CRUD. Employee: none (view own contracts only if explicitly enabled — `[TEAM DECISION REQUIRED]`).

**Validations**: Overlapping active contracts for the same employee/period must be flagged (VAL-CON-001). Exact blocking vs. warning behavior: `[TEAM DECISION REQUIRED]` unless a team decision is logged.

**Workflows**: Contract history preserved indefinitely; active/running contract clearly marked; payroll selects the contract applicable to the selected period rather than "latest contract." `[OFFICIAL REQUIREMENT]` + `[MOCKUP REQUIREMENT]`

**Business rules**: BR-CON-001 (period-applicable selection), BR-CON-002 (overlap detection).

**Dependencies**: Employee, Working Schedule, Salary Structure.

**Acceptance criteria**: For a payroll period spanning a contract change, the system selects the contract whose date range includes that period, not simply the most recently created contract.

---

## Module: Working Schedules

**Purpose**: Define weekly time patterns used for attendance and payroll expectations. `[OFFICIAL REQUIREMENT]`

**Users**: HR Manager+ (CRUD).

**Entities**: `WorkingSchedule`, `WorkingScheduleDay`

**Fields (List)**: name, type, weekly hours (calculated). **Fields (Form)**: per-day Day, Start Time, End Time, Break. `[OFFICIAL REQUIREMENT]`

**Views**: List, Form.

**Actions**: Create, edit, assign to Employee/Contract.

**Relationships**: WorkingSchedule 1—N WorkingScheduleDay; WorkingSchedule 1—N Employee/Contract (assignment).

**Permissions**: HR Manager and above: full CRUD.

**Validations**: Weekly hours must be system-calculated, never accepted as a manually entered authoritative value. `[OFFICIAL REQUIREMENT]`

**Workflows**: Define per-day start/end/break → system computes daily and weekly hours → schedule assignable to Employee or Contract.

**Business rules**: BR-SCH-001.

**Dependencies**: None (leaf configuration entity), consumed by Employee, Contract, Attendance.

**Acceptance criteria**: Editing any day's start/end/break time immediately recalculates the schedule's total weekly hours; the value is never hand-entered.

**Unresolved**: Weekend handling, holidays, flexible/rotating shifts, timezones — all `[TEAM DECISION REQUIRED]`.

---

## Module: Attendance

**Purpose**: Capture daily presence, exceptions, and worked hours. `[OFFICIAL REQUIREMENT]`

**Users**: Employee (create own entries); HR Manager+ (full CRUD, corrections).

**Entities**: `Attendance`

**Fields**: employee, check-in, check-out, worked hours, status. `[OFFICIAL REQUIREMENT]`

**Views**: List, Form, and an Attendance Widget for check-in/check-out. `[MOCKUP REQUIREMENT]`

**Actions**: Check in, check out, manual correction (restricted).

**Relationships**: Attendance N—1 Employee.

**Permissions**: Employee: create own entries, no correction rights. HR Manager+: full CRUD including corrections. `[OFFICIAL REQUIREMENT]`

**Validations**: Missing check-out flagged (VAL-ATT-001); worked hours computed against schedule expectations — exact formula `[TEAM DECISION REQUIRED]`.

**Workflows**: Check-in → (work) → check-out → worked hours computed → status assigned (Present/Late/Absent, per source).

**Business rules**: BR-ATT-001 (worked-hours computation), BR-ATT-002 (correction authorization).

**Dependencies**: Employee, Working Schedule (for expected hours comparison).

**Acceptance criteria**: An authorized user can correct an attendance entry; an unauthorized user (plain Employee) cannot; corrected/raw entries remain available to the Dashboard.

**Unresolved**: Biometric/GPS/geofencing, overtime computation, shift logic — all `[TEAM DECISION REQUIRED]`.

---

## Module: Time Off Types

**Purpose**: Define leave policy configuration. `[OFFICIAL REQUIREMENT]`

**Entities**: `TimeOffType`

**Fields**: name, unit (days/hours), allocation requirement, approval workflow, payroll integration flag, active status.

**Views**: List, Form (accessed under Time Off in main navigation). `[OFFICIAL REQUIREMENT]`

**Permissions**: HR Manager+ CRUD; HR Payroll User/Manager read (for payroll-integration awareness).

**Business rules**: Referenced by BR-LEAVE-001..003.

**Acceptance criteria**: A Time Off Type marked as requiring allocation cannot have a Request approved without sufficient Allocation balance (see Time Off Requests module).

---

## Module: Time Off Allocations

**Purpose**: Track employee leave balances. `[OFFICIAL REQUIREMENT]`

**Entities**: `TimeOffAllocation`

**Fields**: employee, time off type, allocated amount, taken amount, remaining amount, validity period, status. `[OFFICIAL REQUIREMENT]`

**Views**: List, Form.

**Actions**: Create, approve (allocations "require approval before availability" `[OFFICIAL REQUIREMENT]`).

**Relationships**: Allocation N—1 Employee; Allocation N—1 TimeOffType.

**Permissions**: HR Manager+ CRUD/approve; Employee: read own only.

**Validations**: Remaining = Allocated − Taken, always non-negative (VAL-LEAVE-002).

**Business rules**: BR-LEAVE-001 (approval-before-availability), BR-LEAVE-003 (balance consumption source).

**Acceptance criteria**: A newly created allocation is not usable by a Request until it is itself approved.

---

## Module: Time Off Requests

**Purpose**: Employee leave request lifecycle. `[OFFICIAL REQUIREMENT]`

**Entities**: `TimeOffRequest`

**Fields**: employee, time off type, start date, end date, duration, approver, status, reason. `[OFFICIAL REQUIREMENT]`

**Views**: List (Employee, Type, Dates, Duration, Status), Form with approve/refuse actions. `[OFFICIAL REQUIREMENT]`

**Actions**: Submit, approve, refuse.

**Relationships**: Request N—1 Employee; Request N—1 TimeOffType; Request N—1 Allocation (when type requires allocation).

**Permissions**: Employee: create own; HR Manager+: approve/refuse (any employee's), no payroll access needed for this action. `[OFFICIAL REQUIREMENT]`

**Validations**: Insufficient allocation blocks approval when the type requires allocation (VAL-LEAVE-001). Refused/rejected requests must never consume allocation. `[OFFICIAL REQUIREMENT]`

**Workflows**: Pending → Approved (consumes allocation, updates remaining balance) OR Pending → Refused (no balance impact). `[OFFICIAL REQUIREMENT]`

**Business rules**: BR-LEAVE-002 (approval → consumption), BR-LEAVE-003.

**Dependencies**: Allocation, TimeOffType.

**Acceptance criteria**: Approving a request that requires allocation immediately reduces the Allocation's remaining balance by the request's duration; refusing it does not.

---

## Module: Salary Structures

**Purpose**: Containers of Salary Rules used by Payruns. `[OFFICIAL REQUIREMENT]`

**Entities**: `SalaryStructure`

**Fields**: name, associated rules (with sequence), rule count, employee count, active status. `[OFFICIAL REQUIREMENT]`

**Views**: List, Form (manages included rules and execution sequence). `[OFFICIAL REQUIREMENT]`

**Permissions**: HR Payroll User: read-only. HR Payroll Manager+: full CRUD. `[OFFICIAL REQUIREMENT]`

**Relationships**: SalaryStructure 1—N SalaryRule (ordered); Contract N—1 SalaryStructure (default); Payrun N—1 SalaryStructure (selected scope).

**Business rules**: BR-RULE-001 (rules must actually drive payslip generation, not be decorative).

**Acceptance criteria**: The Salary Structure selected on a Payrun determines exactly which Salary Rules are applied when computing that Payrun's Payslips.

---

## Module: Salary Rules

**Purpose**: Define individual earning/deduction computation logic. `[OFFICIAL REQUIREMENT]`

**Entities**: `SalaryRule`, `SalaryRuleCategory`

**Fields**: name, code, category, sequence, calculation type (fixed/percentage/formula), calculation value/formula, active status. `[OFFICIAL REQUIREMENT]`

**Views**: List, Form.

**Permissions**: HR Payroll User: read-only. HR Payroll Manager+: full CRUD. `[OFFICIAL REQUIREMENT]`

**Relationships**: SalaryRule N—1 SalaryStructure; SalaryRule N—1 SalaryRuleCategory.

**Business rules**: BR-RULE-001 (sequencing/dependency), see `07_PAYROLL_ENGINE.md`.

**Validations**: Sequence must be unique/ordered within a structure (VAL-PAY-002, `[TEAM DECISION REQUIRED]` on exact uniqueness enforcement).

**Acceptance criteria**: Rules execute strictly in ascending sequence order; a rule referencing a prior rule's result (e.g., a percentage-of-Basic allowance) receives the correct already-computed intermediate value.

**Unresolved**: Formula syntax, rounding, country/tax-specific logic — all `[TEAM DECISION REQUIRED]`.

---

## Module: Payruns

**Purpose**: Batch payroll processing for a period. `[OFFICIAL REQUIREMENT]`

**Entities**: `Payrun`

**Fields**: name, salary structure, period, status, employee scope, payslips, warnings/validation state. `[OFFICIAL REQUIREMENT]`

**Views**: New Payrun Wizard (2 steps), Payrun Processing screen. `[OFFICIAL REQUIREMENT]`

**Actions**: Continue (Step 1→2), Create Payrun, Compute, Validate, Mark Paid, Send Payslips. `[OFFICIAL REQUIREMENT]`

**Relationships**: Payrun N—1 SalaryStructure; Payrun 1—N Payslip.

**Permissions**: HR Payroll User: Create/Read/Update. HR Payroll Manager+: full CRUD. `[OFFICIAL REQUIREMENT]`

**Validations**: Warnings for missing bank details, duplicate payslips, contract issues surfaced prior to finalization (VAL-PAY-*). `[OFFICIAL REQUIREMENT]`

**Workflows**: See `08_PAYRUN_STATE_MACHINE.md`. Two-step creation wizard is mandatory: Step 1 (Structure + Period) → Continue → Step 2 (employee selection) → Create Payrun. The Payrun record must NOT be created at Step 1. `[OFFICIAL REQUIREMENT]`

**Business rules**: BR-PAY-001 (two-step creation), BR-PAY-002 (lifecycle), BR-PAY-003 (warnings surfaced pre-finalization).

**Dependencies**: Salary Structure, Employees, Contracts.

**Acceptance criteria**: Clicking "New" never creates a Payrun record immediately; a Payrun record is only created after Step 2's "Create Payrun" action, scoped to explicitly selected employees.

---

## Module: Payslips

**Purpose**: Individual employee salary computation and record. `[OFFICIAL REQUIREMENT]`

**Entities**: `Payslip`, `PayslipLine`

**Fields**: employee, structure, payrun, period, status, worked days, computation lines (Basic, Allowances, Gross, Deductions, Net). `[OFFICIAL REQUIREMENT]`

**Views**: Payslips list, Payslip Detail (accessible via parent Payrun or dedicated list). `[OFFICIAL REQUIREMENT]`

**Relationships**: Payslip N—1 Payrun; Payslip N—1 Employee; Payslip 1—N PayslipLine.

**Permissions**: HR Payroll User: Create/Read/Update. HR Payroll Manager+: full CRUD. Employee: read own only (if enabled — `[TEAM DECISION REQUIRED]`).

**Business rules**: BR-PSL-001 (must use applicable period contract + assigned structure + sequenced rules), BR-PSL-002 (duplicate detection).

**Acceptance criteria**: Payslip computation automatically resolves the period-applicable contract; changing the Payrun's Salary Structure and recomputing changes the payslip lines accordingly (no hardcoded amounts).

---

## Module: Dashboard

**Purpose**: Live aggregated reporting across HR and payroll data. `[OFFICIAL REQUIREMENT]`

**Fields/Widgets**: KPI cards (Total Net Salary Paid, Payslips Generated, Average Salary, Approved Time Off, Attendance Health); charts (Salary Cost by Department, Monthly Net Salary Trend); operational alerts (payroll status, missing info, duplicate payslips, contract attention); attendance overview; time off overview; department breakdown. `[OFFICIAL REQUIREMENT]`

**Filters**: Period, Department, Employee Type. `[OFFICIAL REQUIREMENT]`

**Permissions**: HR Payroll User+ (payroll KPIs); HR Manager (HR-only KPIs, no salary figures — `[TEAM DECISION REQUIRED]` on exact split).

**Business rules**: BR-DASH-001 (must be computed live, never static/mocked).

**Acceptance criteria**: Creating a new Payslip and marking a Payrun as Paid immediately changes the "Total Net Salary Paid" KPI on next dashboard load, with no cached/static value.

---

## Module: PDF

**Purpose**: Generate a printable payslip document. `[OFFICIAL REQUIREMENT]`

**Actions**: "Print Payslip" on individual Payslip.

**Business rules**: PDF must be generated from actual Payslip data (see `15_AI_RULES.md` #33).

**Acceptance criteria**: The PDF's line items match exactly the Payslip's computed lines at generation time.

---

## Module: Email Delivery

**Purpose**: Bulk distribute payslips to employees. `[OFFICIAL REQUIREMENT]`

**Actions**: "Send Payslips" on a Payrun (bulk).

**Business rules**: Must use actual Payrun/Payslip records, not synthetic data (see `15_AI_RULES.md` #34). Email provider: `[TEAM DECISION REQUIRED]`.

**Acceptance criteria**: Triggering "Send Payslips" dispatches one payslip-attached email per employee in that Payrun.