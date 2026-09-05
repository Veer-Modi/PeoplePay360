# Person 4: Frontend & Dashboard Guide

## Your Role
You are the **Integration & Analytics Lead**. You are responsible for the entire user interface, cross-module flows, and the live Payroll Dashboard.

## Your Folder Workspace
You will work in: `src/app` (routing/pages) and `src/components/ui` (shared components).

## What You Need to Build
1. **Global Shell**: Navigation, layout, and wiring all 30 screens together.
2. **Dashboard**: A live, data-driven dashboard aggregating metrics from HR, Attendance, Time Off, and Payroll. No static mock data allowed.
3. **Demo Polish**: Ensure the exact demo flow described in `17_DEMO_FLOW.md` clicks through flawlessly without breaking.

## Documents You Must Read
Read these specific sections from the `instructions` folder to understand your tasks perfectly:

1. **`10_UI_SCREEN_SPEC.md`**: (Crucial for you) This is your exact checklist of the 30 screens you must build and wire up.
2. **`17_DEMO_FLOW.md`**: You are responsible for making sure this 5-minute flow works seamlessly.
3. **`09_API_CONTRACT.md`**: This is the data shape you should expect from the backend. Use this to mock your UI before Persons 1, 2, and 3 finish their APIs!
4. **`002 feature spec.md`**: Read the **Dashboard** section.

## Integration Handoffs
- **From Persons 1, 2, & 3**: You depend on all of them for APIs. If their APIs are not ready, build your UI against the agreed-upon API Contract (`09_API_CONTRACT.md`).
- **To the Judges**: You own the visual polish. Ensure all error states (e.g., missing contract warnings) are visually distinct and easy to explain.

---

## Your AI Agent Prompt
*Copy and paste this into your AI coding assistant (like Cursor, GitHub Copilot, or Gemini) to get started:*

> "You are my AI assistant for the PeoplePay360 hackathon project. I am Person 4 (Integration & Analytics Lead). My job is to build the Frontend Shell, UI routing, and the live Payroll Dashboard. You may read all files in the `instructions/` directory for context, but you must strictly follow `instructions/PERSON_4_GUIDE.md`. We are using Next.js, Prisma, MySQL, and Tailwind CSS.
>
> We must work EXCLUSIVELY in `src/app` and `src/components/ui`. You are NOT allowed to modify backend business logic files belonging to other team members (like `src/modules/core-hr`, `src/modules/time-tracking`, or `src/modules/payroll`). 
> 
> Let's start by looking at `10_UI_SCREEN_SPEC.md` and `17_DEMO_FLOW.md` to set up our global layouts, navigation, and the structure of our live dashboard."
