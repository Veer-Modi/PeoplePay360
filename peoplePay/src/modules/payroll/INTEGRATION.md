# Payroll Module Handoff & Frontend Integration Guide (Person 3 -> Person 4)

This document specifies the exact backend APIs and services available for **Person 4 (Frontend & Integration Lead)** to wire into the UI screens specified in `10_UI_SCREEN_SPEC.md`.

---

## 1. UI Screen Mapping to API Routes

| Screen ID & Name | Frontend Route | HTTP Endpoint & Method | Purpose |
|---|---|---|---|
| **Screen 20: Payruns (List)** | `/payroll/payruns` | `GET /api/v1/payruns` | Returns all payruns with period, status, employee count, and payslips count |
| **Screen 21: Wizard Step 1** | `/payroll/payruns/new/step-1` | Client-side only (BR-PAY-001) | Holds name, dates, structure in state. No DB record created! |
| **Screen 22: Wizard Step 2** | `/payroll/payruns/new/step-2` | `POST /api/v1/payruns` | Submits step 1 data + selected `employeeIds`. Creates `Draft` payrun |
| **Screen 23: Payrun Processing** | `/payroll/payruns/[id]` | `GET /api/v1/payruns/[id]` | Displays payrun header, scoped employees, payslips table, warnings panel |
| — Compute Action | — | `POST /api/v1/payruns/[id]/compute` | Runs rule engine; generates payslips & warnings (`Draft ➔ Computed`) |
| — Validate Action | — | `POST /api/v1/payruns/[id]/validate` | Officer review checkpoint (`Computed ➔ Validated`) |
| — Mark Paid Action | — | `POST /api/v1/payruns/[id]/mark-paid` | Finalizes batch & marks all payslips Paid (`Validated ➔ Paid`) |
| — Send Payslips Action | — | `POST /api/v1/payruns/[id]/send-payslips` | Dispatches bulk emails with PDF attachments |
| **Screen 24: Payslips (List)** | `/payroll/payslips` | `GET /api/v1/payslips?payrunId=&employeeId=&status=` | Browse all payslips with filters |
| **Screen 25: Payslip Detail** | `/payroll/payslips/[id]` | `GET /api/v1/payslips/[id]` | Line-by-line category breakdown (Basic, Allowances, Gross, Deductions, Net) |
| — Print Payslip Button | — | `GET /api/v1/payslips/[id]/pdf` | Streams printable `%PDF-1.4` binary download |
| **Screen 26 & 27: Structures** | `/payroll/salary-structures` | `GET` / `POST /api/v1/salary-structures` | List and create salary structures |
| **Screen 27: Structure Detail** | `/payroll/salary-structures/[id]` | `GET` / `PUT` / `DELETE /api/v1/salary-structures/[id]` | Manage structure rules and active status |
| **Screen 28 & 29: Rules** | `/payroll/salary-rules` | `GET` / `POST /api/v1/salary-rules` | List (`?salaryStructureId=`) and create salary rules |
| **Screen 29: Rule Detail** | `/payroll/salary-rules/[id]` | `PUT` / `DELETE /api/v1/salary-rules/[id]` | Edit calculation type, value/formula, category |
| **Screen 30: Dashboard** | `/payroll/dashboard` | `GET /api/v1/dashboard?periodStart=&periodEnd=&departmentId=` | Live aggregated KPIs, charts, alerts, and time-off/attendance health |

---

## 2. State Machine Rules for Screen 23 UI Controls

Action buttons on `/payroll/payruns/[id]` must be enabled/disabled per `08_PAYRUN_STATE_MACHINE.md`:

| Current Status | Compute Button | Validate Button | Mark Paid Button | Send Payslips Button |
|---|---|---|---|---|
| **Draft** | Enabled | **Disabled** (VAL-PAY-003) | **Disabled** (VAL-PAY-003) | **Disabled** |
| **Computed** | Enabled (Re-compute) | Enabled | **Disabled** (VAL-PAY-003) | Enabled |
| **Validated** | **Disabled** | **Disabled** | Enabled | Enabled |
| **Paid** | **Disabled** (Immutable) | **Disabled** | **Disabled** | Enabled (Historical re-send) |

---

## 3. Direct Server-Side Service Alternative (Server Actions / SSR)

If you prefer calling server-side TypeScript directly instead of `fetch()`:

```typescript
import { PayrollService, PayrollAnalyticsService, SalaryConfigurationService } from "@/modules/payroll";

const payroll = new PayrollService();

// 1. Get payrun view
const payrun = await payroll.getPayrun(payrunId);
const payslips = await payroll.getPayslips(payrunId);

// 2. Lifecycle triggers
await payroll.computePayrun(payrunId);
await payroll.validatePayrun(payrunId);
await payroll.markPayrunPaid(payrunId);

// 3. Live Dashboard metrics
const kpis = await PayrollAnalyticsService.getPayrollKpis();
const deptCost = await PayrollAnalyticsService.getSalaryCostByDepartment();
const trend = await PayrollAnalyticsService.getMonthlyNetSalaryTrend();
const alerts = await PayrollAnalyticsService.getPayrollAlerts();
```

---

## 4. Verification

All API routes and domain business rules are verified via:
- `npx tsx src/test-person3.ts` (Core engine & state machine)
- `npx tsx src/test-payroll-api.ts` (Full HTTP routes & PDF download)
