# 15 — AI Development Constitution

This document is binding on every AI coding agent working on this project. It supersedes convenience, speed, or "cleaner code" instincts whenever they conflict with these rules.

## Mandatory Rules

AI agents MUST:

1. Read `/docs/00_SOURCE_OF_TRUTH.md` before writing any code.
2. Read the relevant module's documentation (Feature Spec, Business Rules, API Contract, UI Spec) before modifying that module.
3. Never invent business rules not present in the source material or `18_DECISIONS.md`.
4. Never silently change the database schema (`04_DATABASE_SCHEMA.md`) — propose the change, get it recorded in `18_DECISIONS.md`, then implement.
5. Never silently change API contracts (`09_API_CONTRACT.md`) — same process as #4.
6. Never modify a module owned by another team member (see `16_TEAM_TASKS.md`) without explicit permission.
7. Never hardcode payroll calculations — all amounts must flow through the Payroll Engine (`07_PAYROLL_ENGINE.md`).
8. Never hardcode dashboard data — all KPIs/charts must be live-queried (BR-DASH-001).
9. Never bypass RBAC checks, even temporarily "to test something."
10. Never trust frontend-only authorization — every backend endpoint re-checks role/ownership.
11. Never duplicate an existing service — search first, extend if possible.
12. Never create a duplicate entity that overlaps an existing one in `04_DATABASE_SCHEMA.md`.
13. Reuse existing components/utilities where possible instead of rewriting.
14. Preserve existing naming conventions once established by the team.
15. Preserve existing database relationships — do not restructure foreign keys without a logged decision.
16. Add validation (per `11_VALIDATION_RULES.md`) for any new business operation introduced.
17. Add tests (per `12_TEST_CASES.md` patterns) for any business-critical logic added.
18. Keep payroll calculations deterministic — same inputs must always produce the same outputs (see `07_PAYROLL_ENGINE.md`).
19. Keep historical payroll records immutable after a Payrun reaches `Paid` status, unless a team decision explicitly supports an amendment/correction flow.
20. Never use fake/mock data in production code paths — mock data belongs only in tests and `13_SEED_DATA.md`.
21. Never delete functionality simply to make implementation easier under time pressure.
22. Never modify files/modules unrelated to the current task.
23. Never install new dependencies without team approval.
24. Explain any proposed schema/API/business-rule change before making it — do not make it and explain afterward.
25. If requirements conflict across documents, STOP and report the conflict rather than silently choosing one.
26. If a requirement is ambiguous or unspecified, mark it `TEAM DECISION REQUIRED` and log it in `18_DECISIONS.md` rather than guessing.
27. Never treat a mockup's visual appearance as the full backend requirement — a screen showing a field does not by itself define its validation/business logic.
28. Never treat a stated backend requirement as optional merely because it has no corresponding visual mockup element.
29. Backend permissions (RBAC) are always authoritative over UI-level hiding/disabling.
30. Salary Rules must actually drive Payslip generation — never a static/mock payslip.
31. A Payrun must always resolve and use the applicable period contract (BR-CON-001), never "the latest contract."
32. The Dashboard must always reflect live system data, recomputed per request/filter change.
33. PDF payslips must be generated from actual, persisted Payslip data at generation time.
34. Bulk payslip email must use actual Payrun/Payslip records — never placeholder/lorem-ipsum content.

## Coding Workflow

1. Read relevant docs (rule #1–2).
2. If anything is ambiguous, check `18_DECISIONS.md`; if still unresolved, flag it and pause rather than guessing.
3. Implement within your owned module boundary (`14_ARCHITECTURE.md`, `16_TEAM_TASKS.md`).
4. Write/extend tests per `12_TEST_CASES.md` for the touched business logic.
5. Update documentation if the implementation reveals a gap (propose the update; do not silently deviate from docs).

## Documentation Workflow

- Any newly resolved `[TEAM DECISION REQUIRED]` item must be moved into `18_DECISIONS.md` with a Decision ID before the corresponding code is merged.
- Any schema or API change must be reflected in `04_DATABASE_SCHEMA.md` / `09_API_CONTRACT.md` in the same change set as the code.

## Testing Workflow

- New business logic requires a corresponding entry in `12_TEST_CASES.md` (or an already-covering existing test case referenced).
- Payroll Engine changes require re-running TC-ENGINE-001 (determinism) and TC-RULE-* before merge.

## Review Workflow

- A module owner reviews changes to their module before merge.
- Cross-cutting changes (schema, RBAC, API contract) require sign-off from whichever team member owns the affected downstream module(s).

## Conflict Resolution

If two documents or two team members' expectations conflict, the agent must:
1. Stop implementation on the conflicting piece.
2. Record the conflict in `18_DECISIONS.md` as `CONFLICT REQUIRES TEAM DECISION`.
3. Wait for an explicit team decision before proceeding.

## Definition of Done (per feature)

- [ ] Matches the relevant Feature Spec section exactly (or a logged deviation exists in `18_DECISIONS.md`)
- [ ] All applicable Business Rules enforced
- [ ] All applicable Validations implemented (blocking/non-blocking as specified or decided)
- [ ] Backend authorization enforced independent of frontend
- [ ] Relevant test cases pass
- [ ] No hardcoded/mock data in the production code path
- [ ] Documentation updated if any gap was discovered during implementation
