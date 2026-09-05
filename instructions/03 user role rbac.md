# 03 — User Roles & RBAC Matrix

All role definitions are `[OFFICIAL REQUIREMENT]` as stated in the PDF. Cell-level CRUD mapping to specific modules not explicitly enumerated by name in the source is `[MOCKUP REQUIREMENT]`/`[TEAM DECISION]` inference from the stated role summaries, and is marked accordingly below.

## Legend
C = Create, R = Read, U = Update, D = Delete, A = Approve, Cmp = Compute, Val = Validate, MP = Mark Paid, Snd = Send, — = No access

## Permission Matrix

| Module | Employee | HR Manager | HR Payroll User | HR Payroll Manager | Admin |
|---|---|---|---|---|---|
| Users & Roles | — | — | — | — | CRUD + role assignment `[MOCKUP REQUIREMENT]` |
| Employees | R (own only) | CRUD | CRUD (inherited) | CRUD (inherited) | CRUD |
| Contracts | — | CRUD | CRUD (inherited) | CRUD (inherited) | CRUD |
| Working Schedules | — | CRUD | CRUD (inherited) | CRUD (inherited) | CRUD |
| Attendance | C, R (own) | CRUD | CRUD (inherited) | CRUD (inherited) | CRUD |
| Time Off Types | — | CRUD | CRUD (inherited) | CRUD (inherited) | CRUD |
| Time Off Allocations | R (own) | CRUD | CRUD (inherited) | CRUD (inherited) | CRUD |
| Time Off Requests | C, R (own) | CRUD, A (approve/refuse) | CRUD, A (inherited) | CRUD, A (inherited) | CRUD, A |
| Salary Structures | — | — | R only | CRUD | CRUD |
| Salary Rules | — | — | R only | CRUD | CRUD |
| Payruns | — | — | C, R, U | CRUD, Cmp, Val, MP, Snd | CRUD, Cmp, Val, MP, Snd |
| Payslips | — | — | C, R, U | CRUD | CRUD |
| Dashboard | — | R (HR-scope KPIs only — `[TEAM DECISION REQUIRED]`) | R (payroll-scope KPIs) | R (full) | R (full) |
| PDF Generation | — | — | Y (on own Payslip access) | Y | Y |
| Bulk Email Send | — | — | `[TEAM DECISION REQUIRED]` — likely no, since Send is a Payrun action tied to Payroll Manager workflow | Y | Y |

> Note: "CRUD (inherited)" means the role explicitly inherits all permissions of the role below it per the PDF's role definitions ("HR Payroll User = All HR Manager permissions + ...").

## Role Summaries (source text, verbatim intent)

### Employee
- View own employee details, attendance records, leave balances.
- Create attendance entries and Time Off Requests.
- No payroll or HR administration access.

### HR Manager
- Full CRUD: Employees, Attendance, Contracts, Working Schedules, Time Off.
- Approve/refuse Time Off Requests.
- No payroll feature access.

### HR Payroll User
- All HR Manager permissions.
- Create/Read/Update: Payruns, Payslips.
- Read-only: Salary Structures, Salary Rules.

### HR Payroll Manager
- All HR Payroll User permissions.
- Full CRUD: Payruns, Payslips, Salary Structures, Salary Rules.
- Full control over HR and payroll configuration.

### Admin
- Full access to all modules/models.
- User management, role assignment, permission updates, system administration.

## Authentication

`[MOCKUP REQUIREMENT]` Users authenticate via login screen; access is scoped by assigned Role after login. Session mechanism (JWT/session cookie/etc.): `[TEAM DECISION REQUIRED]`.

## Authorization

- **Record ownership**: An Employee-role user may only read/write their own Attendance and Time Off Request records, and read their own Employee profile and Allocation balances.
- **UI permission vs. API/backend permission**: The frontend must hide unauthorized actions, but this is cosmetic only. **Backend authorization is authoritative** — every API endpoint must independently re-check the caller's role/ownership regardless of what the UI displayed (see `15_AI_RULES.md` #9–10, #29).
- **Employee self-service**: Employee role is scoped entirely to their own `Employee` record and its directly related `Attendance`/`TimeOffRequest`/`TimeOffAllocation` rows.
- **HR access**: HR Manager and above see all employees' HR data, never restricted to "own" records.
- **Payroll access**: Only HR Payroll User/Manager and Admin may read/write Payrun, Payslip, Salary Structure, Salary Rule data.
- **Admin access**: Unrestricted, plus exclusive control of User/Role management.

## Backend Enforcement Rule

Every module's service layer must independently validate: (a) the caller has an active session, (b) the caller's Role includes the requested action for that module, (c) if the action is scoped to "own records," the target record's owning Employee matches the caller's linked Employee. Failure on any check returns an authorization error and performs no side effect.