# Person 1: Core HR & Authentication Guide

## Your Role
You are the **Foundation & Identity Lead**. You are responsible for Authentication, User Management, Employees, Contracts, and Working Schedules.

## Your Folder Workspace
You will work exclusively in: `src/modules/core-hr` and `src/modules/auth`.

## What You Need to Build
1. **Authentication**: Login/Logout and enforcing RBAC (Role-Based Access Control).
2. **Employee Hub**: CRUD for Employee profiles (Kanban, List, Form).
3. **Contracts**: Track historical contracts. Most importantly, expose a function/service that Payroll (Person 3) can use to get the *active* contract for a specific date range.
4. **Schedules**: Auto-calculate weekly working hours based on defined shifts.

## Documents You Must Read
Read these specific sections from the `instructions` folder to understand your tasks perfectly:

1. **`03 user role rbac.md`**: (Crucial for you) Understand the 5 roles and permissions you must enforce.
2. **`002 feature spec.md`**: Read the sections for **Authentication, User Management, Employees, Contracts, and Working Schedules**.
3. **`04 database schema.md`**: Look at the tables for `User`, `Role`, `Employee`, `Contract`, `WorkingSchedule`, and `WorkingScheduleDay`.
4. **`10_UI_SCREEN_SPEC.md`**: Read Screens **1 through 10**.

## Integration Handoffs
- **To Person 2 & 3**: They will need your Employee IDs and Working Schedule IDs.
- **To Person 3 (Payroll)**: You must provide a `getApplicableContract(employeeId, startDate, endDate)` function for them to use.
- **To Person 4 (Frontend)**: Ensure your APIs match what they need for the UI.

---

## Your AI Agent Prompt
*Copy and paste this into your AI coding assistant (like Cursor, GitHub Copilot, or Gemini) to get started:*

> "You are my AI assistant for the PeoplePay360 hackathon project. I am Person 1 (Foundation & Identity Lead). My job is to build the Authentication, User Management, Employees, Contracts, and Working Schedules modules. You may read all files in the `instructions/` directory for context, but you must strictly follow `instructions/PERSON_1_GUIDE.md`. We are using Next.js, Prisma, MySQL, and Tailwind CSS.
>
> We must work EXCLUSIVELY in `src/modules/core-hr` and `src/modules/auth`. You are NOT allowed to modify files belonging to other team members (like `src/modules/time-tracking`, `src/modules/payroll`, or `src/app`). 
> 
> Let's start by looking at `04 database schema.md` for my entities (User, Role, Employee, Contract, WorkingSchedule, WorkingScheduleDay) and setting up our Prisma schema and NextAuth configuration."
