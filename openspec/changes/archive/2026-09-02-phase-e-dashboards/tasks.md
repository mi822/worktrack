## 1. Admin dashboard

- [x] 1.1 Wire the admin home to live counts (users total and by role, today’s present/late/absent/attendance %, projects total/active/completed/overdue, tasks by status, EOD summary counts, intern log counts) with empty states, and verify an empty database shows empty copy rather than hardcoded numbers
- [x] 1.2 Verify Absent is computed (no Absent inserts), completed/overdue match the design formulas, and one real scan/task/log changes the corresponding count

## 2. Manager and project head dashboards

- [x] 2.1 Wire manager home to that manager’s projects, progress, deadlines, budgets, and task stats, and verify another manager’s projects are excluded
- [x] 2.2 Wire project-head home to assigned projects, pending reviews (submitted + resubmitted), approved/rejected, employee vs intern progress, and relevant intern logs, and verify empty states when nothing is assigned

## 3. Employee and intern dashboards

- [x] 3.1 Wire employee home to today’s presence, assigned tasks/deadlines/progress/feedback, and EOD status, and verify a user with no tasks and no scan sees empty/not-recorded states
- [x] 3.2 Wire intern home the same way plus learning-log status, and verify it does not show another intern’s tasks or logs

## 4. Security and empty-data close-out

- [x] 4.1 Re-test role isolation on dashboard routes and queries (intern cannot hit admin aggregates; manager cannot read another manager’s projects) and verify unauthorized requests are refused
- [x] 4.2 Confirm no dashboard code path inserts demo users, projects, tasks, attendance, summaries, or logs, and verify a fresh bootstrap-only database still renders empty states

## 5. Phase E walkthrough

- [x] 5.1 Walk all five dashboards against real rows created in earlier phases, and verify numbers match the database and `role-dashboards`
