# Integration & Demo Handoff Guide (Person 2)

## 5-Minute Live Demo Alignment (Scenario 2)

Per `instructions/17_DEMO_FLOW.md`:

### 1. Attendance Exception (Minute 1:15–2:00)
- Navigate to `/attendance`.
- Highlight **Devansh Rao's** attendance list.
- Point out:
  - Day 1: Normal `Present` record (8.50 hrs).
  - Day 2: `Late` record.
  - Day 3: Prominent **"Missing Checkout"** exception badge (`VAL-ATT-001`).

### 2. Time Off Approval & Balance Deduction (Minute 4:00–4:40)
- Navigate to `/time-off`.
- Click on **Leave Requests** tab.
- Find **Devansh Rao's** `Pending` 3-day request.
- Click **Approve**.
- Notice the immediate confirmation banner: `"Request approved and allocation balance deducted atomically (BR-LEAVE-002)!"`
- Switch to the **Leave Allocations** tab:
  - Show Devansh Rao's Annual Leave:
  - `Allocated`: 14
  - `Taken`: 3 (increased from 0)
  - `Remaining`: 11 (decreased from 14)

### 3. Dashboard Handoff (Minute 4:40–5:00)
- Person 4's Dashboard can call `getDashboardOperationalMetrics()` from `@/modules/time-tracking` to display live Approved Time Off and Attendance Health.
