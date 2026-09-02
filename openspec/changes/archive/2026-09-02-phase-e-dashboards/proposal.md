## Why

Phases A–D store identity, presence, work, and daily writes. Phase E is the last slice: each role gets a dashboard that only shows aggregates from those tables. If a table is empty, the UI says so — never dummy statistics.

## What Changes

- Separate dashboards for Admin, Manager, Project Head, Employee, and Intern, replacing Phase A empty shells with real counts.
- Admin: users (total and by role), today’s presence (present, late, absent, attendance %), projects (total, active, completed, overdue), tasks by status, employee engagement as real summary/presence/task counts, intern learning-log statistics.
- Manager: their projects, progress, deadlines, budgets, task statistics.
- Project Head: assigned projects and progress, tasks, pending reviews, approved/rejected, employee vs intern task progress, intern learning logs.
- Employee: today’s presence, assigned tasks, deadlines, progress, feedback, EOD summary status.
- Intern: today’s presence, assigned tasks, deadlines, progress, feedback, learning-log status.
- Absent is computed (expected scanners on a working day with no presence row). Completed/overdue projects are derived from deadlines and task completion, not fake statuses.
- Hard-coded numbers, placeholder charts, and seed analytics are forbidden.

Depends on Phases A–D being applied (empty dashboards are valid if those tables have no rows). No new product features beyond read-only aggregation and empty states.

## Capabilities

### New Capabilities

- `role-dashboards`: Five role-specific dashboards bound to live queries; empty-state copy when a metric has no rows; no dummy analytics.

### Modified Capabilities

- None. Earlier capabilities are not given new write behaviors; dashboards only read them.

## Impact

- Dashboard queries/views over existing tables; RLS must still hide other people’s data.
- Phase A role homes become these dashboards.
- Testing and security validation of the full stack is part of this phase’s close-out, not a license to add features.
