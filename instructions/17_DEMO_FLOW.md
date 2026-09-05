# 17 — Demo Flow (5-Minute Live Demonstration)

`[OFFICIAL REQUIREMENT]`: the demo must cover at least two end-to-end scenarios.

## Pre-Demo Checklist (data that must exist before starting)

- [ ] Seed data loaded per `13_SEED_DATA.md`
- [ ] "September 2026 Payroll" Payrun exists in **Draft** status, scoped to 6 employees (including Aditya Verma, who has no contract, to demonstrate the warning)
- [ ] Devansh Rao has a **Pending** Time Off Request ready to approve live
- [ ] Priya Nair's historical + active contracts are visible in her Contract history
- [ ] "August 2025 Payroll" exists as a **Paid**, historical Payrun (feeds Dashboard trend chart)
- [ ] Login credentials for HR Payroll Manager and HR Manager accounts are ready

## Minute-by-Minute Walkthrough

**0:00–0:30 — Login & RBAC**
Log in as HR Payroll Manager. Briefly show the role-based navigation (mention Employee/HR Manager/Payroll roles exist and are enforced).

**0:30–1:15 — Employee & Contract (Scenario 1 start)**
Open Priya Nair's Employee Form. Click the Contracts smart button — show her historical (expired) contract and her current active one, highlighting that payroll will use the correct one for the period.

**1:15–2:00 — Attendance**
Open Devansh Rao's Attendance list — show a normal Present day and the one flagged missing-checkout exception.

**2:00–3:15 — Payroll (core of the demo)**
Open the "September 2026 Payroll" Draft Payrun. Click **Compute**. Show:
- Aditya Verma flagged with a `missing_contract` warning (proves the engine doesn't fabricate data for missing inputs)
- Other employees' Payslips generated with correct Basic/Allowances/Gross/Deductions/Net lines, driven by the "Regular Salary" structure's rules

**3:15–4:00 — Payslip & PDF**
Open Devansh Rao's computed Payslip. Walk through the line breakdown. Click **Print Payslip** to generate the PDF live. (Optionally trigger **Send Payslips** on the Payrun to show bulk email — P1 fallback: show the outbound log if live SMTP isn't wired.)

**4:00–4:40 — Time Off (Scenario 2)**
Switch to Devansh Rao's Pending Time Off Request. Approve it live. Immediately reload his Allocation to show the remaining balance decreased by exactly the request's duration.

**4:40–5:00 — Dashboard**
Open the Payroll Dashboard. Show the KPIs (Total Net Salary Paid now includes the just-computed Payrun once marked Paid, or reflects August's historical Paid Payrun), the Salary Cost by Department chart, and the Approved Time Off KPI incrementing from the approval just performed — proving the Dashboard is live, not static.

## What To Click, In Order

1. Login screen → HR Payroll Manager credentials
2. Employees → Priya Nair → Contracts smart button
3. Attendance → Devansh Rao's list
4. Payroll → Payruns → "September 2026 Payroll" → Compute
5. Payroll → Payslips → Devansh Rao's payslip → Print Payslip
6. Time Off → Requests → Devansh Rao's pending request → Approve
7. Time Off → Allocations → Devansh Rao's allocation (show reduced balance)
8. Reports → Payroll Dashboard

## Expected Outputs at Each Step

| Step | Expected Output |
|---|---|
| Compute | Aditya flagged; other 5 employees get computed Payslips |
| Print Payslip | PDF opens/downloads matching on-screen breakdown exactly |
| Approve leave | Request status → Approved; Allocation remaining decreases |
| Dashboard | KPIs/charts reflect the just-performed actions on reload |

## Fallback If a Live Feature Fails

- **PDF generation fails live**: Have a pre-generated sample PDF ready to show, and verbally explain the generation is driven by the same Payslip data model.
- **Email sending fails/not configured**: Show the "Send Payslips" action triggering and describe the intended SMTP integration; show a server log entry as evidence of the attempt if available.
- **Compute throws an error on stage**: Fall back to a pre-computed Payrun from seed data and walk through its already-generated Payslips instead.
- **Dashboard query is slow**: Have it pre-loaded in a second browser tab before the demo starts.

## Future Roadmap (brief note, per deliverable requirement)

`[TEAM DECISION REQUIRED]` — to be filled in by the team, but likely candidates given the source material's flagged "TEAM DECISION REQUIRED" items: statutory tax/rounding rule support, overtime and shift handling, multi-company/multi-currency payroll, an audit-log entity, and employee self-service payslip access.
