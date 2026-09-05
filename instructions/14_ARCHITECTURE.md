# 14 — Architecture

`[OFFICIAL REQUIREMENT]`: "Teams are free to use any programming language, framework, or database technology." No specific stack is mandated by this document.

## Logical Layers

```
Frontend (Web UI: Kanban/List/Form screens, Payrun Wizard, Dashboard)
    ↓  (HTTP/JSON)
API Layer (routing, request validation, auth token verification)
    ↓
Authentication / Authorization Layer (session/token check, RBAC enforcement — authoritative, per 03_USER_ROLES_RBAC.md)
    ↓
Controllers / Route Handlers (thin — parse request, call services, format response)
    ↓
Services / Business Logic Layer
    ├── Employee Service
    ├── Contract Service            (BR-CON-001, BR-CON-002 — applicable-contract resolution)
    ├── Working Schedule Service    (BR-SCH-001 — hours calculation)
    ├── Attendance Service          (BR-ATT-001, BR-ATT-002)
    ├── Time Off Service            (BR-LEAVE-001..003 — allocation/request/balance logic)
    ├── Salary Structure/Rule Service
    ├── Payroll Engine Service      (07_PAYROLL_ENGINE.md — the core calculation pipeline)
    ├── Payrun Service              (08_PAYRUN_STATE_MACHINE.md — lifecycle enforcement)
    ├── PDF Service                 (payslip PDF generation)
    ├── Email Service               (bulk payslip delivery)
    └── Dashboard Aggregation Service (BR-DASH-001 — live query aggregation, no static caching without invalidation)
    ↓
Repositories / Data Access Layer (one per entity/module; no business logic here)
    ↓
Database (schema per 04_DATABASE_SCHEMA.md)
```

## Where Logic Must Live

| Concern | Layer | Notes |
|---|---|---|
| Payroll calculation | Payroll Engine Service | Never in the frontend, never hardcoded (BR-RULE-001) |
| Contract selection | Contract Service | Consumed by Payroll Engine Service, not duplicated elsewhere |
| Leave balance logic | Time Off Service | Single source of truth for allocation math |
| Attendance hours calculation | Attendance Service | Compares against Working Schedule Service output |
| Salary rule evaluation | Payroll Engine Service | Reads structure/rules via Salary Structure/Rule Service |
| Validation (all `11_VALIDATION_RULES.md` entries) | Corresponding Service layer, re-checked at the API boundary | Never trust frontend-only validation |
| Authorization | Auth/Authorization Layer + re-checked per-service | Backend authoritative (see RBAC doc) |
| Dashboard aggregation | Dashboard Aggregation Service | Reads from repositories directly; must not read from a stale/static cache without explicit, documented invalidation |

## Module Boundaries

- **Core HR** (Employee, Contract, Working Schedule) owns employee/contract data; other modules reference it by ID, never duplicate it.
- **Attendance & Time Off** owns attendance and leave data; reads Employee/Working Schedule by reference.
- **Payroll** (Salary Structure, Salary Rule, Payrun, Payslip) owns payroll data; reads Employee/Contract/Attendance/Time Off by reference, never mutates them.
- **Dashboard** is read-only across all other modules; owns no primary data itself.

## Data Ownership

Each entity in `04_DATABASE_SCHEMA.md` has exactly one owning module/service responsible for writes to it. Cross-module reads are allowed; cross-module writes are not (e.g., the Payroll module must never directly write to the Attendance table — it only reads).

## Parent-Child Relationships

- Payrun → Payslip → PayslipLine (strict containment; a PayslipLine cannot exist without a Payslip, which cannot exist without a Payrun).
- WorkingSchedule → WorkingScheduleDay (strict containment).
- SalaryStructure → SalaryRule (containment, but rules may in principle be reused conceptually across structures if the team decides — `[TEAM DECISION REQUIRED]`; default assumption is one-to-many exclusive containment per the source's "container" language).
- TimeOffType → TimeOffAllocation / TimeOffRequest (reference, not containment — Type is configuration, not a parent record).

## Transaction Boundaries

- **Payrun Compute**: must be wrapped in a transaction per employee (or per Payrun) so that a partial failure does not leave orphaned Payslip/PayslipLine rows.
- **Time Off Approval**: Request status change + Allocation balance update must be atomic (single transaction) — see BR-LEAVE-002.
- **Contract save**: overlap check + save should be evaluated within the same transaction to avoid race conditions between concurrent HR Manager edits.

## What This Document Does Not Do

It does not mandate React vs. Vue, Node vs. Django vs. Spring, Postgres vs. MySQL vs. MongoDB, or REST vs. GraphQL. Those are `[TEAM DECISION REQUIRED]` and belong in `18_DECISIONS.md` once chosen.
