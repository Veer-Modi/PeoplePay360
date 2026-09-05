# 10 — UI Screen Specification

All screens below are derived from `[MOCKUP REQUIREMENT]` (Flow 0–6 descriptions) combined with `[OFFICIAL REQUIREMENT]` module descriptions in the PDF. No screen beyond this list should be invented.

---

## 1. Login
- **Purpose**: Authenticate a user.
- **Route**: `/login`
- **Roles**: Unauthenticated.
- **Fields**: work email, password.
- **Buttons**: Log in.
- **Error state**: Invalid credentials / inactive account message.
- **Success state**: Redirect to role-appropriate landing page.

## 2. User Management (List)
- **Purpose**: Admin view/search/filter of all Users.
- **Route**: `/admin/users`
- **Roles**: Admin only.
- **Table columns**: work email, linked employee, role, active status.
- **Filters**: role filter, search.
- **Buttons**: Create User.
- **Empty state**: "No users found."

## 3. Create/Edit User
- **Purpose**: Create or edit a User account.
- **Route**: `/admin/users/new`, `/admin/users/{id}`
- **Roles**: Admin only.
- **Fields**: work email, employee (selector), role (selector), active toggle.
- **Actions**: Save, Cancel.
- **Validation messages**: "Email required," "Email already in use," "Role required."

## 4. Employees Kanban
- **Purpose**: Visual pipeline/grouping of employees.
- **Route**: `/employees/kanban`
- **Roles**: HR Manager+.
- **Layout**: Cards grouped by department/status (`[TEAM DECISION REQUIRED]` on exact grouping dimension).
- **Card fields**: name, job position, department, status.
- **Navigation**: Click card → Employee Form.

## 5. Employees List
- **Purpose**: Tabular employee browsing.
- **Route**: `/employees`
- **Roles**: HR Manager+ (all); Employee (self row only).
- **Columns**: name, department, manager, status, work email.
- **Filters/search**: department, status, name search.
- **Navigation**: Row click → Employee Form.

## 6. Employee Form
- **Purpose**: Central operational hub for one employee.
- **Route**: `/employees/{id}`
- **Roles**: HR Manager+ (full); Employee (self, read + limited).
- **Fields**: identity, department, manager, job position, working schedule, status, work email, work location, company.
- **Smart buttons**: Contracts (count), Attendance (count), Time Off (count), Allocations (count) — each opens a filtered list for this employee.
- **Actions**: Save, Archive.
- **State-dependent**: Employee role sees a reduced, read-only version of this form for their own record.

## 7. Contracts List
- **Purpose**: Browse all contracts, or one employee's contract history.
- **Route**: `/contracts`, `/employees/{id}/contracts`
- **Roles**: HR Manager+.
- **Columns**: employee, dates, wage, status (active clearly highlighted).
- **Navigation**: Row click → Contract Form.

## 8. Contract Form
- **Purpose**: Create/edit a contract.
- **Route**: `/contracts/new`, `/contracts/{id}`
- **Roles**: HR Manager+.
- **Fields**: employee, department, job position, start date, end date, wage, working schedule, salary structure, status.
- **Validation messages**: "Overlapping active contract detected for this employee" (VAL-CON-001).
- **Actions**: Save.

## 9. Working Schedule List
- **Purpose**: Browse schedules.
- **Route**: `/schedules`
- **Roles**: HR Manager+.
- **Columns**: name, type, weekly hours (computed), status.

## 10. Working Schedule Form
- **Purpose**: Define a weekly pattern.
- **Route**: `/schedules/new`, `/schedules/{id}`
- **Roles**: HR Manager+.
- **Fields**: name, type, per-day (Day, Start Time, End Time, Break) rows, computed total weekly hours (read-only, live-updating).
- **Actions**: Save.

## 11. Attendance List
- **Purpose**: Review attendance entries and exceptions.
- **Route**: `/attendance`, `/employees/{id}/attendance`
- **Roles**: HR Manager+ (all); Employee (self).
- **Columns**: Employee, Check In, Check Out, Worked Hours, Status.
- **Filters**: date range, status, employee.
- **Highlighting**: exceptions (e.g., missing checkout) visually flagged.

## 12. Attendance Form
- **Purpose**: Detailed view / manual correction.
- **Route**: `/attendance/{id}`
- **Roles**: HR Manager+ (edit); Employee (view own, no edit — BR-ATT-002).
- **Fields**: employee, check in, check out, worked hours (computed), status.
- **State-dependent controls**: Edit fields disabled for Employee role.

## 13. Attendance Widget
- **Purpose**: Quick check-in/check-out control.
- **Route**: Embedded (dashboard/topbar) — `[MOCKUP REQUIREMENT]`.
- **Roles**: All authenticated users (for own attendance).
- **Buttons**: Check In / Check Out (state-dependent — shows Check In when not checked in, Check Out when checked in).
- **Success state**: Confirmation of timestamp recorded.

## 14. Time Off Requests (List)
- **Purpose**: Overview of leave requests.
- **Route**: `/time-off/requests`
- **Roles**: HR Manager+ (all); Employee (self).
- **Columns**: Employee, Type, Dates, Duration, Status.
- **Navigation**: Row click → Time Off Request Form.

## 15. Time Off Request Form
- **Purpose**: Submit / review / approve a request.
- **Route**: `/time-off/requests/new`, `/time-off/requests/{id}`
- **Roles**: Employee (create own); HR Manager+ (approve/refuse any).
- **Fields**: employee, type, start date, end date, duration (computed), reason, status.
- **Buttons**: Submit (Employee); Approve, Refuse (HR Manager+).
- **Validation message**: "Insufficient leave balance" (VAL-LEAVE-001) shown when Approve would exceed remaining allocation.
- **Success state**: On approve, allocation balance updates are reflected immediately upon reload.

## 16. Allocations (List)
- **Purpose**: Browse leave balances.
- **Route**: `/time-off/allocations`
- **Roles**: HR Manager+ (all); Employee (self, read).
- **Columns**: employee, type, allocated, taken, remaining, validity, status.

## 17. Allocation Form
- **Purpose**: Create/approve an allocation.
- **Route**: `/time-off/allocations/new`, `/time-off/allocations/{id}`
- **Roles**: HR Manager+.
- **Fields**: employee, type, allocated amount, validity period, status.
- **Buttons**: Save, Approve.

## 18. Time Off Types (List)
- **Purpose**: Configure leave policies.
- **Route**: `/time-off/types`
- **Roles**: HR Manager+.
- **Columns**: name, unit, requires allocation, requires approval, active.

## 19. Time Off Type Form
- **Purpose**: Define one leave policy.
- **Route**: `/time-off/types/new`, `/time-off/types/{id}`
- **Roles**: HR Manager+.
- **Fields**: name, unit (days/hours), allocation requirement toggle, approval workflow toggle, payroll integration toggle, active.

## 20. Payruns (List)
- **Purpose**: Browse payroll batches.
- **Route**: `/payroll/payruns`
- **Roles**: HR Payroll User+.
- **Columns**: name, structure, period, status.
- **Buttons**: New (launches wizard — BR-PAY-001).

## 21. New Payrun Wizard — Step 1
- **Purpose**: Define scope.
- **Route**: `/payroll/payruns/new/step-1` (or modal step state)
- **Roles**: HR Payroll User+.
- **Fields**: Salary Structure (selector), Period (date range picker).
- **Buttons**: Continue (→ Step 2, no record created — BR-PAY-001).

## 22. New Payrun Wizard — Step 2
- **Purpose**: Select employees.
- **Route**: `/payroll/payruns/new/step-2`
- **Roles**: HR Payroll User+.
- **Fields**: filterable/searchable eligible-employee list with checkboxes.
- **Buttons**: Back, Create Payrun (persists the Payrun with only the selected employees).

## 23. Payrun Processing
- **Purpose**: Manage one Payrun through its lifecycle.
- **Route**: `/payroll/payruns/{id}`
- **Roles**: HR Payroll User+ (view/compute); HR Payroll Manager+ (validate/mark paid/send).
- **Displays**: run name, structure, period, status, summary list of payslips, warnings panel.
- **Buttons**: Compute, Validate, Mark Paid, Send Payslips (each enabled only per `08_PAYRUN_STATE_MACHINE.md`).
- **State-dependent controls**: Buttons disabled for invalid transitions given current status.
- **Warnings**: missing bank details, duplicate payslips, contract attention items highlighted prominently.

## 24. Payslips (List)
- **Purpose**: Browse all payslips, standalone from a specific Payrun.
- **Route**: `/payroll/payslips`
- **Roles**: HR Payroll User+.
- **Columns**: employee, structure, payrun, period, status, net total.
- **Filters**: period, employee, status.

## 25. Payslip Detail
- **Purpose**: View full computed breakdown.
- **Route**: `/payroll/payslips/{id}`
- **Roles**: HR Payroll User+ (all); Employee (self only, if enabled — `[TEAM DECISION REQUIRED]`).
- **Fields**: employee, structure, payrun, period, status, worked days.
- **Table**: salary computation lines (rule name, category, amount) grouped by category — Basic, Allowances, Gross, Deductions, Net.
- **Buttons**: Print Payslip (generates PDF).

## 26. Salary Structures (List)
- **Purpose**: Browse structures.
- **Route**: `/payroll/salary-structures`
- **Roles**: HR Payroll User (read); HR Payroll Manager+ (full).
- **Columns**: name, rule count, employee count, active.

## 27. Salary Structure Detail
- **Purpose**: Manage a structure's rule set and order.
- **Route**: `/payroll/salary-structures/{id}`
- **Roles**: HR Payroll Manager+ (edit); HR Payroll User (read-only).
- **Fields**: name, active toggle.
- **Table**: ordered list of included Salary Rules with drag/sequence control.

## 28. Salary Rules (List)
- **Purpose**: Browse rules.
- **Route**: `/payroll/salary-rules`
- **Roles**: HR Payroll User (read); HR Payroll Manager+ (full).
- **Columns**: name, code, category, sequence, active.

## 29. Salary Rule Detail
- **Purpose**: Configure one rule's calculation.
- **Route**: `/payroll/salary-rules/{id}`
- **Roles**: HR Payroll Manager+ (edit); HR Payroll User (read-only).
- **Fields**: name, code, category, sequence, calculation type (fixed/percentage/formula), calculation value/formula, active.
- **Validation**: sequence must be a positive integer; formula syntax validated (`[TEAM DECISION REQUIRED]` on exact grammar).

## 30. Payroll Dashboard
- **Purpose**: Live aggregated reporting.
- **Route**: `/payroll/dashboard`
- **Roles**: HR Manager+ (scoped per RBAC).
- **Filters**: Period, Department, Employee Type.
- **KPI cards**: Total Net Salary Paid, Payslips Generated, Average Salary, Approved Time Off, Attendance Health.
- **Charts**: Salary Cost by Department (bar), Monthly Net Salary Trend (line).
- **Alerts panel**: payroll statuses, missing required information, duplicate payslips, contract attention items — each clickable to the related record.
- **Attendance overview**: Present, Late, Absent, Overtime, missing check-outs, manual edits, attendance coverage.
- **Time Off overview**: approved days, pending requests, leave balances.
- **Department breakdown**: headcount + salary expenditure table/chart.
- **Loading state**: skeleton/placeholder while live queries resolve.
- **Empty state**: "No data for selected filters."

---

## Cross-Screen Notes

- All list/table screens must support the filters and search explicitly described above; no additional filters should be invented without being marked `[TEAM DECISION]`.
- All forms should show inline validation messages tied to the corresponding entries in `11_VALIDATION_RULES.md`.
- Buttons whose action is disallowed by the current record state (e.g., Payrun lifecycle, TimeOffRequest already approved) must be disabled or hidden, but the backend remains the authoritative enforcement point (see `03_USER_ROLES_RBAC.md`).
