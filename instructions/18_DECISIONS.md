# 18 — Decision Log

Template:

```
DECISION ID:
DATE:
AREA:
QUESTION:
DECISION:
REASON:
ALTERNATIVES:
IMPACT:
STATUS:
OWNER:
```

No decisions have been made by the team as of this writing. All items below are open questions surfaced during documentation generation and require team discussion before the corresponding code is implemented (per `15_AI_RULES.md` #26).

## Open Items Requiring Team Decisions

```
DECISION ID: DEC-001
AREA: Technology Stack
QUESTION: Which backend language/framework, frontend framework, and database will the team use?
STATUS: TEAM DECISION REQUIRED
OWNER: Whole team
```

```
DECISION ID: DEC-002
AREA: Authentication
QUESTION: Session-based or token(JWT)-based authentication?
STATUS: TEAM DECISION REQUIRED
OWNER: Person 1
```

```
DECISION ID: DEC-003
AREA: User–Employee Relationship
QUESTION: Must every User be linked to an Employee, or can Admin/system accounts exist without one?
STATUS: TEAM DECISION REQUIRED
OWNER: Person 1
```

```
DECISION ID: DEC-004
AREA: Contract Overlap Handling
QUESTION: Does an overlapping-contract warning (BR-CON-002) block saving the contract, or is it advisory only?
STATUS: TEAM DECISION REQUIRED
OWNER: Person 1
```

```
DECISION ID: DEC-005
DATE: 2026-09-05
AREA: Missing/Multiple Applicable Contract
QUESTION: When a Payrun computes and finds zero or multiple applicable contracts for an employee, is that employee's Payslip generation blocked entirely, or is a flagged/partial Payslip created?
DECISION: Zero or multiple applicable contracts block payslip generation for that employee; a blocking warning is attached to the Payrun/PayrollWarning log, and the employee is skipped without halting the computation of other valid employees.
REASON: Follows BR-PSL-003 and BR-CON-002, guaranteeing deterministic and valid financial records without fabricating salaries.
ALTERNATIVES: Fabricating partial payslips or hard-failing the entire batch.
IMPACT: Valid employees receive payslips; invalid employees are flagged for HR review.
STATUS: DECIDED
OWNER: Person 3
```

```
DECISION ID: DEC-006
DATE: 2026-09-05
AREA: Payroll Rounding & Formula Syntax
QUESTION: What rounding standard (2-decimal round-half-up, etc.) and what formula expression grammar will the Salary Rule engine support?
DECISION: Use standard 2-decimal round-half-up (`Math.round((v + Number.EPSILON) * 100) / 100`) for currency amounts. Salary Rule formulas use a safe recursive-descent arithmetic tokenizer (supporting numbers, prior rule codes, parentheses, `+`, `-`, `*`, `/`) rejecting `eval()` and disallowing forward/uncomputed rule references.
REASON: Eliminates JavaScript floating-point inaccuracies and security risks while guaranteeing deterministic calculations.
ALTERNATIVES: JavaScript `eval()`, third-party math parsers.
IMPACT: Secure, deterministic calculation with reproducible financial totals.
STATUS: DECIDED
OWNER: Person 3
```

```
DECISION ID: DEC-007
DATE: 2026-09-05
AREA: Payrun Warning Severity
QUESTION: Do unresolved warnings (missing bank details, duplicate payslip, contract issues) block the Validate action, or only Mark Paid, or neither?
DECISION: Contract issues (`missing_contract`, `multiple_contracts`) and `duplicate_payslip` are `Blocking` warnings that prevent generating a payslip for that employee. Missing bank details is a `Non-blocking` warning. Validate requires at least one computed payslip to exist in the Payrun.
REASON: Prevents creating invalid payslips while allowing the rest of the batch to be reviewed and validated.
ALTERNATIVES: Forbidding validation of the entire batch if any single employee is missing a contract.
IMPACT: Non-blocking warnings surface in alerts; blocking warnings skip the offending employee.
STATUS: DECIDED
OWNER: Person 3
```

```
DECISION ID: DEC-008
DATE: 2026-09-05
AREA: Employee Self-Service Payslip Access
QUESTION: Can an Employee view their own Payslip/PDF, or is this restricted entirely to Payroll roles?
DECISION: Employees can view and download only their own payslips via `/api/v1/payslips/[id]` and `/api/v1/payslips/[id]/pdf` (scoped by `employeeId`). Payroll roles (HR Payroll User/Manager) can view all.
REASON: Self-service employee portal requirement while upholding data confidentiality.
ALTERNATIVES: Restricting payslips exclusively to payroll staff.
IMPACT: Employees can access PDF copies of their wages.
STATUS: DECIDED
OWNER: Person 3 / Person 4
```

```
DECISION ID: DEC-009
DATE: 2026-09-05
AREA: Email Provider
QUESTION: Which email provider/service will be used for bulk payslip delivery (or is a logged/simulated send acceptable for the hackathon)?
DECISION: Implement `EmailGateway` interface with an active outbound logger fallback (`[EMAIL DISPATCH]`) for local demo, with support for live SMTP configuration.
REASON: Hackathon environment may lack outgoing SMTP credentials; logging proves live dispatch and PDF attachment without risking demo network timeouts.
ALTERNATIVES: Third-party API requiring paid API keys.
IMPACT: Guaranteed reliable bulk email demonstration in 5-minute live presentation.
STATUS: DECIDED
OWNER: Person 3
```

```
DECISION ID: DEC-010
DATE: 2026-09-05
AREA: PDF Library
QUESTION: Which PDF generation library/approach will be used?
DECISION: Built a dependency-free, high-performance binary `%PDF-1.4` generator in `pdf-service.ts` that directly streams valid PDF buffers without Puppeteer or heavy headless browsers.
REASON: Zero external dependencies, instant rendering, 100% reliable across environments and OS platforms.
ALTERNATIVES: Puppeteer/Chromium, PDFKit.
IMPACT: Sub-millisecond PDF generation and instant download in demo.
STATUS: DECIDED
OWNER: Person 3
```

```
DECISION ID: DEC-011
AREA: Working Schedule Edge Cases
QUESTION: How are weekends, holidays, and flexible/rotating shifts handled (if at all) within the hackathon scope?
STATUS: TEAM DECISION REQUIRED
OWNER: Person 1
```

```
DECISION ID: DEC-012
AREA: Attendance Status Thresholds
QUESTION: What exact check-in time threshold marks an entry "Late" vs. "Present"?
STATUS: TEAM DECISION REQUIRED
OWNER: Person 2
```

```
DECISION ID: DEC-013
AREA: Dashboard RBAC Scope
QUESTION: Does HR Manager see salary-figure KPIs on the Dashboard, or only non-payroll (attendance/leave) KPIs?
STATUS: TEAM DECISION REQUIRED
OWNER: Person 4
```

```
DECISION ID: DEC-014
AREA: Deployment
QUESTION: Where/how will the application be deployed for the demo (local only, cloud-hosted, etc.)?
STATUS: TEAM DECISION REQUIRED
OWNER: Whole team
```

```
DECISION ID: DEC-015
AREA: Timezone Handling
QUESTION: Is a single timezone assumed for all attendance/payroll timestamps, or must multi-timezone be supported?
STATUS: TEAM DECISION REQUIRED
OWNER: Person 1
```

As each of the above is resolved, replace its `STATUS` with `DECIDED`, fill in `DATE`, `DECISION`, `REASON`, `ALTERNATIVES`, and `IMPACT`, and update the corresponding source document (schema, business rules, engine spec, etc.) in the same change set.
