# Person 2: Attendance & Time Off Guide

## Your Role
You are the **Operations & Leave Logic Lead**. You are responsible for Attendance tracking and the entire Leave Request lifecycle.

## Your Folder Workspace
You will work exclusively in: `src/modules/time-tracking`.

## What You Need to Build
1. **Attendance**: Check-in/out logic, calculating worked hours (against the schedule Person 1 made), and exception flagging (e.g., missing check-out).
2. **Time Off Types**: Configure different types of leave (e.g., Sick, Vacation).
3. **Allocations & Requests**: The core logic here is that an employee submits a request, a manager approves it, and **ONLY upon approval** does the allocation balance decrease.

## Documents You Must Read
Read these specific sections from the `instructions` folder to understand your tasks perfectly:

1. **`002 feature spec.md`**: Read the sections for **Attendance, Time Off Types, Allocations, and Requests**.
2. **`06_BUSINESS_RULES.md`**: Pay very close attention to **BR-ATT-001** and **BR-LEAVE-001 to 003**.
3. **`04 database schema.md`**: Look at the tables for `Attendance`, `TimeOffType`, `TimeOffAllocation`, and `TimeOffRequest`.
4. **`10_UI_SCREEN_SPEC.md`**: Read Screens **11 through 19**.

## Integration Handoffs
- **From Person 1**: You will use their Employee and Working Schedule data to calculate expected hours.
- **To Person 3 (Payroll)**: Your approved unpaid leave might affect payroll depending on the Time Off Type configuration.
- **To Person 4 (Frontend)**: Supply the APIs for the attendance widget and leave request lists.

---

## Your AI Agent Prompt
*Copy and paste this into your AI coding assistant (like Cursor, GitHub Copilot, or Gemini) to get started:*

> "You are my AI assistant for the PeoplePay360 hackathon project. I am Person 2 (Operations & Leave Logic Lead). My job is to build the Attendance tracking and Time Off Request lifecycle. You may read all files in the `instructions/` directory for context, but you must strictly follow `instructions/PERSON_2_GUIDE.md`. We are using Next.js, Prisma, MySQL, and Tailwind CSS.
>
> We must work EXCLUSIVELY in `src/modules/time-tracking`. You are NOT allowed to modify files belonging to other team members (like `src/modules/core-hr`, `src/modules/payroll`, or `src/app`). 
> 
> Let's start by looking at `04 database schema.md` for my entities (Attendance, TimeOffType, TimeOffAllocation, TimeOffRequest) and setting up our API endpoints and logic for calculating worked hours and deducting leave balances upon approval."
