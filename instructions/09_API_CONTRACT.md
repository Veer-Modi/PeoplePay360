# 09 — API Contract

`[IMPLEMENTATION DETAIL]`: Exact route naming/style (REST vs. RPC, `/api/v1/...` prefix, casing) is a team choice — `[TEAM DECISION REQUIRED]`. Below is the required *operation set*, not a mandated exact URL scheme. Endpoints not listed here should not be invented.

Convention used below for illustration: REST-style, `/api/v1/...`.

---

## Authentication

| Method | Endpoint | Purpose | Auth | Roles |
|---|---|---|---|---|
| POST | /api/v1/auth/login | Log in with email/password | None | All |
| POST | /api/v1/auth/logout | End session | Session | All |

**Request** (login): `{ work_email, password }`
**Response**: `{ token/session, user: { id, role, employee_id } }`
**Errors**: 401 invalid credentials, 403 inactive user.

---

## Users (Admin only)

| Method | Endpoint | Purpose | Roles |
|---|---|---|---|
| GET | /api/v1/users | List/search/filter users | Admin |
| POST | /api/v1/users | Create user | Admin |
| GET | /api/v1/users/{id} | Get user | Admin |
| PUT | /api/v1/users/{id} | Update user (role, employee link, active) | Admin |

**Business rules triggered**: BR-AUTH-002.
**Validation**: unique work_email; role required.

---

## Employees

| Method | Endpoint | Purpose | Roles |
|---|---|---|---|
| GET | /api/v1/employees | List/filter (Kanban/List data) | HR Manager+ (all); Employee (self only, filtered server-side) |
| POST | /api/v1/employees | Create | HR Manager+ |
| GET | /api/v1/employees/{id} | Get employee detail | HR Manager+ (any); Employee (self only) |
| PUT | /api/v1/employees/{id} | Update | HR Manager+ |
| GET | /api/v1/employees/{id}/contracts | Related contracts (smart button) | HR Manager+ |
| GET | /api/v1/employees/{id}/attendance | Related attendance | HR Manager+; Employee (self) |
| GET | /api/v1/employees/{id}/time-off | Related time off | HR Manager+; Employee (self) |
| GET | /api/v1/employees/{id}/allocations | Related allocations | HR Manager+; Employee (self) |

**Business rules**: BR-EMP-001.

---

## Contracts

| Method | Endpoint | Purpose | Roles |
|---|---|---|---|
| GET | /api/v1/contracts | List (with active-contract highlighting) | HR Manager+ |
| POST | /api/v1/contracts | Create | HR Manager+ |
| GET | /api/v1/contracts/{id} | Get | HR Manager+ |
| PUT | /api/v1/contracts/{id} | Update | HR Manager+ |

**Business rules**: BR-CON-001, BR-CON-002.
**Validation**: overlap check on save (VAL-CON-001).

---

## Working Schedules

| Method | Endpoint | Purpose | Roles |
|---|---|---|---|
| GET | /api/v1/schedules | List | HR Manager+ |
| POST | /api/v1/schedules | Create (with days) | HR Manager+ |
| GET | /api/v1/schedules/{id} | Get (with computed weekly_hours) | HR Manager+ |
| PUT | /api/v1/schedules/{id} | Update days → recompute weekly_hours | HR Manager+ |

**Business rules**: BR-SCH-001.

---

## Attendance

| Method | Endpoint | Purpose | Roles |
|---|---|---|---|
| GET | /api/v1/attendance | List/filter | HR Manager+ (all); Employee (self) |
| POST | /api/v1/attendance/check-in | Create check-in | Employee (self), HR Manager+ |
| POST | /api/v1/attendance/{id}/check-out | Record check-out, compute worked_hours | Employee (self), HR Manager+ |
| PUT | /api/v1/attendance/{id} | Correction | HR Manager+ only (BR-ATT-002) |

**Business rules**: BR-ATT-001, BR-ATT-002.
**Validation**: VAL-ATT-001 (missing checkout).

---

## Time Off Types

| Method | Endpoint | Purpose | Roles |
|---|---|---|---|
| GET | /api/v1/time-off-types | List | HR Manager+ |
| POST | /api/v1/time-off-types | Create | HR Manager+ |
| PUT | /api/v1/time-off-types/{id} | Update | HR Manager+ |

---

## Time Off Allocations

| Method | Endpoint | Purpose | Roles |
|---|---|---|---|
| GET | /api/v1/allocations | List/filter | HR Manager+ (all); Employee (self, read) |
| POST | /api/v1/allocations | Create | HR Manager+ |
| POST | /api/v1/allocations/{id}/approve | Approve allocation | HR Manager+ |

**Business rules**: BR-LEAVE-001.

---

## Time Off Requests

| Method | Endpoint | Purpose | Roles |
|---|---|---|---|
| GET | /api/v1/time-off-requests | List/filter | HR Manager+ (all); Employee (self) |
| POST | /api/v1/time-off-requests | Submit request | Employee (self), HR Manager+ |
| POST | /api/v1/time-off-requests/{id}/approve | Approve → consume allocation | HR Manager+ |
| POST | /api/v1/time-off-requests/{id}/refuse | Refuse → no balance impact | HR Manager+ |

**Business rules**: BR-LEAVE-002, BR-LEAVE-003.
**Validation**: VAL-LEAVE-001 (insufficient balance blocks approve).

---

## Salary Structures

| Method | Endpoint | Purpose | Roles |
|---|---|---|---|
| GET | /api/v1/salary-structures | List | HR Payroll User (read), HR Payroll Manager+ (full) |
| POST | /api/v1/salary-structures | Create | HR Payroll Manager+ |
| PUT | /api/v1/salary-structures/{id} | Update (rules, sequence) | HR Payroll Manager+ |

---

## Salary Rules

| Method | Endpoint | Purpose | Roles |
|---|---|---|---|
| GET | /api/v1/salary-rules | List | HR Payroll User (read), HR Payroll Manager+ (full) |
| POST | /api/v1/salary-rules | Create | HR Payroll Manager+ |
| PUT | /api/v1/salary-rules/{id} | Update | HR Payroll Manager+ |

**Business rules**: BR-RULE-001.

---

## Payruns

| Method | Endpoint | Purpose | Roles |
|---|---|---|---|
| GET | /api/v1/payruns | List | HR Payroll User+ |
| POST | /api/v1/payruns | Create (Step 2 "Create Payrun" only — see BR-PAY-001) | HR Payroll User+ |
| GET | /api/v1/payruns/{id} | Get processing view (status, payslips, warnings) | HR Payroll User+ |
| POST | /api/v1/payruns/{id}/compute | Run payroll engine | HR Payroll User+ |
| POST | /api/v1/payruns/{id}/validate | Validate | HR Payroll Manager+ |
| POST | /api/v1/payruns/{id}/mark-paid | Mark paid | HR Payroll Manager+ |
| POST | /api/v1/payruns/{id}/send-payslips | Bulk email | HR Payroll Manager+ |

**Note**: There is intentionally NO "create draft at Step 1" endpoint. Step 1's Structure+Period selection is held client-side (or in a transient/unsaved state) until Step 2's employee selection completes (BR-PAY-001).

**Business rules**: BR-PAY-001, BR-PAY-002, BR-PAY-003.
**Errors**: 409 on invalid state transition.

---

## Payslips

| Method | Endpoint | Purpose | Roles |
|---|---|---|---|
| GET | /api/v1/payslips | List/filter | HR Payroll User+ |
| GET | /api/v1/payslips/{id} | Detail (lines, breakdown) | HR Payroll User+; Employee (self, if enabled — `[TEAM DECISION REQUIRED]`) |
| GET | /api/v1/payslips/{id}/pdf | Generate/download PDF | HR Payroll User+ |

**Business rules**: BR-PSL-001, BR-PSL-002, BR-RULE-001.

---

## Dashboard

| Method | Endpoint | Purpose | Roles |
|---|---|---|---|
| GET | /api/v1/dashboard?period=&department=&employee_type= | Live aggregated KPIs/charts/alerts | HR Manager+ (scope per RBAC) |

**Business rules**: BR-DASH-001. Must compute from live tables at request time (no cached static payload beyond a short-lived cache with defined invalidation, if implemented — `[IMPLEMENTATION DETAIL]`).

---

## General Error Conventions

`[TEAM DECISION REQUIRED]` for exact error schema; minimum requirement:

- 400 — validation error (body includes field-level messages)
- 401 — unauthenticated
- 403 — unauthorized (role/ownership check failed)
- 404 — not found
- 409 — invalid state transition (e.g., Payrun lifecycle)
- 422 — business rule violation (e.g., insufficient leave balance, overlapping contract)

All authorization checks are re-verified server-side regardless of what the client/UI displayed (see `03_USER_ROLES_RBAC.md`, `15_AI_RULES.md` #10, #29).
