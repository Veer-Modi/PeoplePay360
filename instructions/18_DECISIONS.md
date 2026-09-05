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
AREA: Missing/Multiple Applicable Contract
QUESTION: When a Payrun computes and finds zero or multiple applicable contracts for an employee, is that employee's Payslip generation blocked entirely, or is a flagged/partial Payslip created?
STATUS: TEAM DECISION REQUIRED
OWNER: Person 3
```

```
DECISION ID: DEC-006
AREA: Payroll Rounding & Formula Syntax
QUESTION: What rounding standard (2-decimal round-half-up, etc.) and what formula expression grammar will the Salary Rule engine support?
STATUS: TEAM DECISION REQUIRED
OWNER: Person 3
```

```
DECISION ID: DEC-007
AREA: Payrun Warning Severity
QUESTION: Do unresolved warnings (missing bank details, duplicate payslip, contract issues) block the Validate action, or only Mark Paid, or neither?
STATUS: TEAM DECISION REQUIRED
OWNER: Person 3
```

```
DECISION ID: DEC-008
AREA: Employee Self-Service Payslip Access
QUESTION: Can an Employee view their own Payslip/PDF, or is this restricted entirely to Payroll roles?
STATUS: TEAM DECISION REQUIRED
OWNER: Person 3 / Person 4
```

```
DECISION ID: DEC-009
AREA: Email Provider
QUESTION: Which email provider/service will be used for bulk payslip delivery (or is a logged/simulated send acceptable for the hackathon)?
STATUS: TEAM DECISION REQUIRED
OWNER: Person 3
```

```
DECISION ID: DEC-010
AREA: PDF Library
QUESTION: Which PDF generation library/approach will be used?
STATUS: TEAM DECISION REQUIRED
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
