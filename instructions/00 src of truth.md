# 00 — Source of Truth & Interpretation Rules

## Project

**PEOPLEPAY360 — HR & Payroll**
An integrated HR and Payroll Operations Platform built for a 24-hour hackathon.

## Source Documents

| # | Document | Type | Role |
|---|---|---|---|
| 1 | `PeoplePay360_HR___Payroll.pdf` | Official Problem Statement | Primary authority |
| 2 | Excalidraw mockup link (`https://app.excalidraw.com/l/65VNwvy7c4X/17vHpCNFjex`) | Functional mockup | Secondary authority — **NOTE**: the actual mockup image/screenshots were not attached to this documentation task. The functional-flow descriptions supplied directly in the documentation-generation instructions (Flows 0–6, screen list in `10_UI_SCREEN_SPEC.md`) are treated as the authoritative stand-in for the mockup content, since they were explicitly provided as "representing the intended functional UX." If the team later reviews the actual Excalidraw board and finds a discrepancy, that discrepancy must be logged in `18_DECISIONS.md` and resolved before the affected module is built. |
| 3 | Team decisions (none recorded as of this writing) | Team decision | Tertiary authority |
| 4 | Nothing else | — | No other source (no generic HRMS knowledge, no Odoo docs, no AI assumptions) may be treated as a requirement. |

## Source Priority (highest to lowest)

1. Official Problem Statement (PDF)
2. Excalidraw functional flow (as represented via the flow descriptions provided)
3. Explicitly approved team decisions (`18_DECISIONS.md`)
4. Nothing else — no external HRMS knowledge, no invented defaults

## Requirement Classification Labels

Every requirement, screen, field, and rule in this documentation package is tagged with exactly one of the following labels:

| Label | Meaning |
|---|---|
| `[OFFICIAL REQUIREMENT]` | Stated directly in the PDF problem statement. |
| `[MOCKUP REQUIREMENT]` | Stated in the functional-flow description that stands in for the Excalidraw mockup. |
| `[TEAM DECISION]` | Explicitly decided by the team and recorded in `18_DECISIONS.md`. |
| `[IMPLEMENTATION DETAIL]` | A technical choice (naming, storage format, library) that does not change business behavior. |
| `[TEAM DECISION REQUIRED]` | Not specified anywhere in the source material. Must not be treated as decided. Must appear in `18_DECISIONS.md`. |

## Rules for Handling Ambiguity

1. If a requirement is unclear, do not guess — mark it `[TEAM DECISION REQUIRED]`.
2. If two source documents conflict, do not silently pick one — log it in `18_DECISIONS.md` as `CONFLICT REQUIRES TEAM DECISION`.
3. If a requirement seems "standard" for HR/payroll systems generally but is not stated in the source, it must NOT be added as a mandatory requirement. It may only be offered as an `[IMPLEMENTATION RECOMMENDATION]`, clearly separated from `[OFFICIAL REQUIREMENT]` / `[MOCKUP REQUIREMENT]` text.
4. A mockup showing a UI element does not by itself create backend/business-logic requirements beyond what it visually depicts — but a backend requirement stated in the PDF is not optional just because it isn't drawn in the mockup (see `15_AI_RULES.md`, rules 27–28).
5. Country-specific tax law, overtime law, statutory payroll rules, and specific rounding/formula syntax are never invented. All are `[TEAM DECISION REQUIRED]` unless the PDF states them (it does not).

## Official vs. Team Decisions

- **Official**: Anything traceable to a sentence in the PDF or the provided flow description.
- **Team**: Anything the 4-person team explicitly agrees on and records with a decision ID in `18_DECISIONS.md`. Team decisions may fill gaps but must never contradict an official or mockup requirement.

## Mockup vs. Functional Requirement Distinction

- The mockup/flow description defines **UX shape**: what screens exist, what fields are visible, what buttons appear, what navigation looks like.
- The PDF defines **business behavior**: what the system must compute, validate, and enforce.
- Where the mockup implies a UI element with no stated backend behavgior (e.g., a filter dropdown with no defined filter logic), the missing behavior is `[TEAM DECISION REQUIRED]`, not invented.

## Governing Principle

This document package exists so that four developers and multiple AI coding agents share a single, unambiguous source of truth. When in doubt, always return to this file's priority order, and when nothing in the source answers a question, write `TEAM DECISION REQUIRED` instead of guessing.