# Person 3: Payroll Engine Guide

## Your Role
You are the **Payroll & Computation Lead**. You own the most complex business logic in the app: the Payroll Engine.

## Your Folder Workspace
You will work exclusively in: `src/modules/payroll`.

## What You Need to Build
1. **Salary Rules**: Build the engine that sequences and executes calculations (fixed, percentage, or formula).
2. **Payruns**: Implement a 2-step wizard. Step 1 selects the period/structure, Step 2 selects employees. Ensure valid state transitions (Draft -> Computed -> Validated -> Paid).
3. **Payslips**: Generate payslips that accurately pull the active contract for the period, apply the rules, and catch duplicates.
4. **PDF & Email**: Generate PDF outputs for payslips and handle bulk email distribution.

## Documents You Must Read
Read these specific sections from the `instructions` folder to understand your tasks perfectly:

1. **`07_PAYROLL_ENGINE.md`**: (Crucial for you) This defines exactly how the pipeline calculates wages.
2. **`08_PAYRUN_STATE_MACHINE.md`**: Understand the allowed transitions for a Payrun.
3. **`002 feature spec.md`**: Read the sections for **Salary Structures, Rules, Payruns, Payslips, PDF, and Email**.
4. **`04 database schema.md`**: Look at the tables for `SalaryStructure`, `SalaryRule`, `Payrun`, and `Payslip`.
5. **`10_UI_SCREEN_SPEC.md`**: Read Screens **20 through 29**.

## Integration Handoffs
- **From Person 1 (Core HR)**: You must call their `getApplicableContract()` service to determine the correct contract for the payroll period. Do NOT simply query the database for the "latest" contract yourself.
- **From Person 2 (Time Off)**: You may need unpaid leave data to deduct from payroll.
- **To Person 4 (Dashboard)**: Your finalized Payslips will power the financial charts on the Dashboard.

---

## Your AI Agent Prompt
*Copy and paste this into your AI coding assistant (like Cursor, GitHub Copilot, or Gemini) to get started:*

> "You are my AI assistant for the PeoplePay360 hackathon project. I am Person 3 (Payroll & Computation Lead). My job is to build the Salary Rules, Payruns, Payslips, and PDF generation. You may read all files in the `instructions/` directory for context, but you must strictly follow `instructions/PERSON_3_GUIDE.md`. We are using Next.js, Prisma, MySQL, and Tailwind CSS.
>
> We must work EXCLUSIVELY in `src/modules/payroll`. You are NOT allowed to modify files belonging to other team members (like `src/modules/core-hr`, `src/modules/time-tracking`, or `src/app`). 
> 
> Let's start by looking at `04 database schema.md` for my entities (SalaryStructure, SalaryRule, Payrun, Payslip) and `07_PAYROLL_ENGINE.md` to design our deterministic calculation pipeline."
