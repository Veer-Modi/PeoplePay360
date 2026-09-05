# Payroll module

This is Person 3's bounded payroll domain. It owns salary-rule evaluation, Payrun lifecycle logic, Payslip computation, PDF generation, and bulk-email orchestration.

The module deliberately contains no Next.js route handlers or UI code. Person 4 can call the exported services from the approved API/UI integration layer.

## Key guarantees

- Salary rules execute in ascending sequence order.
- Formulas may use only earlier computed rule codes and basic arithmetic.
- A Payrun is not persisted at wizard step one.
- State changes follow `Draft -> Computed -> Validated -> Paid`.
- Contract resolution is delegated to Person 1's Contract service.
