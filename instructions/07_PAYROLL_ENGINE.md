# 07 — Payroll Calculation Engine Specification

## Purpose

Define exactly how a Payslip's computed lines are produced. This is the single most important piece of business logic in the platform (`[OFFICIAL REQUIREMENT]`).

## Inputs

| Input | Source | Notes |
|---|---|---|
| Employee | Payrun's selected employee scope | Step 2 of Payrun wizard |
| Applicable Contract | Resolved per BR-CON-001 | Must match payroll period |
| Payroll Period | Payrun.period_start / period_end | Set in Step 1 |
| Salary Structure | Payrun.salary_structure_id | Set in Step 1 |
| Salary Rules | SalaryStructure's active rules, ordered by sequence | — |
| Worked Days / Attendance | Employee's Attendance records for the period (where a rule depends on it) | `[TEAM DECISION REQUIRED]` on exact dependency mechanism |
| Approved Leave | Employee's approved TimeOffRequests for the period (where relevant) | `[TEAM DECISION REQUIRED]` on which rules consume this |

## Process

```
1. Determine payroll period          (Payrun.period_start/end)
2. FOR EACH employee in Payrun.employee_scope:
   a. Find applicable contract        (BR-CON-001)
      IF none found → raise warning "missing_contract"; SKIP employee
      IF multiple found → raise warning "multiple_contracts"; use [TEAM DECISION REQUIRED] tie-break, or SKIP
   b. Validate contract uniqueness for period (BR-CON-002)
   c. Load Payrun.salary_structure
   d. Load active SalaryRules for that structure, sorted ascending by sequence
   e. Initialize computation context:
        context = { BASIC: null, GROSS: null, NET: null, ... per rule code }
   f. FOR EACH rule in sorted rules:
        value = evaluate(rule, employee, contract, context, worked_days, approved_leave)
        context[rule.code] = value
        CREATE PayslipLine(rule=rule, category=rule.category, amount=value, sequence=rule.sequence)
   g. gross_total = SUM(lines WHERE category == 'Gross')
      net_total   = SUM(lines WHERE category == 'Net')
   h. CREATE Payslip(employee, contract, structure, period, worked_days, lines, gross_total, net_total, status='Computed')
   i. Run validation checks (11_VALIDATION_RULES.md) → attach PayrollWarning rows as needed
3. Persist all Payslips + PayslipLines + PayrollWarnings within the Payrun
4. Set Payrun.status = 'Computed'
```

## Rule Evaluation (`evaluate` function)

```
FUNCTION evaluate(rule, employee, contract, context, worked_days, approved_leave):
    SWITCH rule.calculation_type:
        CASE "fixed":
            RETURN rule.calculation_value

        CASE "percentage":
            # calculation_value stores {percentage, base_rule_code}
            base_amount = context[rule.calculation_value.base_rule_code]
            IF base_amount IS null:
                RAISE error "rule sequence error: base rule not yet computed"
            RETURN base_amount * (rule.calculation_value.percentage / 100)

        CASE "formula":
            # calculation_value stores an expression referencing context keys,
            # e.g. "BASIC * 0.1 + TRANSPORT"
            RETURN safe_eval(rule.calculation_value.expression, context)

        DEFAULT:
            RAISE error "unsupported calculation_type"
```

`safe_eval` implementation, exact formula grammar, and rounding strategy: **`[TEAM DECISION REQUIRED]`** — not specified in the source. Do not invent a specific parser or rounding rule; the team must choose and record this in `18_DECISIONS.md`.

## Output

- `Payslip` (header: employee, contract, structure, period, status, worked_days, gross_total, net_total)
- `PayslipLine[]` (one per executed Salary Rule, tagged with category and computed amount)
- `PayrollWarning[]` (zero or more, per validation)

## Categories

`[OFFICIAL REQUIREMENT]` Basic, Allowances, Gross, Deductions, Net. A rule's category determines which dashboard/report bucket its line contributes to, and typically which totals (Gross, Net) sum it.

## Rule Dependencies & Sequence

`[OFFICIAL REQUIREMENT]` Rules execute strictly by ascending `sequence`. A rule may reference an earlier rule's computed value (by its `code`) as input — e.g., "HRA = 20% of BASIC" requires BASIC (sequence 1) to run before HRA (sequence 2). The engine must never allow a rule to reference a rule with a higher sequence number; doing so is a configuration error to be caught, not silently resolved.

## Rounding

`[TEAM DECISION REQUIRED]` — no rounding standard specified in the source (e.g., round-half-up to 2 decimals vs. banker's rounding). Must be recorded in `18_DECISIONS.md` before payroll computation is implemented, since it affects reproducibility.

## Error Handling

| Scenario | Behavior |
|---|---|
| No applicable contract | Skip employee's Payslip; raise `missing_contract` warning (BR-PSL-003) |
| Multiple applicable contracts | Raise `multiple_contracts` warning (BR-CON-002); resolution strategy `[TEAM DECISION REQUIRED]` |
| Rule references a not-yet-computed value | Hard error — configuration bug, must be caught before demo, not handled gracefully at runtime |
| Formula parse failure | Hard error, surfaced to HR Payroll Manager, must not silently default to 0 |
| Duplicate Payslip attempt | Rejected per unique constraint (BR-PSL-002) |

## Worked Example (illustrative only — not a source-defined tax rule)

Assume Salary Structure "Regular Salary" with rules:
1. `BASIC` (sequence 1, fixed) = 30,000
2. `TRANSPORT` (sequence 2, percentage, 10% of BASIC) = 3,000
3. `GROSS` (sequence 3, formula, BASIC + TRANSPORT) = 33,000
4. `DEDUCTION` (sequence 4, fixed) = 1,000
5. `NET` (sequence 5, formula, GROSS − DEDUCTION) = 32,000

This demonstrates sequencing and dependency only — actual rule content for the hackathon build is a `[TEAM DECISION]` to be made during seed-data design (`13_SEED_DATA.md`).

## Determinism Requirement

`[OFFICIAL REQUIREMENT]` (implied by "historical payroll tracking" and "keep payroll calculations deterministic" in `15_AI_RULES.md` #18): re-running Compute on an unchanged Payrun/Contract/Rule set must always produce identical Payslip line amounts.
