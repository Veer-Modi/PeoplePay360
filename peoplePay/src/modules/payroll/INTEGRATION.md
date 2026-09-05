# Integration handoff

## Required adapters

`PayrunService` takes two interfaces rather than importing another person's module directly:

- `ContractResolver.getApplicableContracts(employeeId, period)` must be supplied by Person 1. It must apply BR-CON-001 and return all period-applicable contracts so the payroll module can flag conflicts.
- `PayrollRepository` must be implemented with Prisma after the team approves a stored Payrun employee-scope relation. The current shared schema defines Payrun and Payslip but does not yet persist the employee IDs selected in wizard step two.

## Required team decision

Do not silently change the shared Prisma schema. The team must approve the `PayrunEmployee` (or equivalent) mapping before a Prisma repository can persist the Step 2 employee scope required by BR-PAY-001.
