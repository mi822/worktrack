## Why

Task rows do not capture what people learned or how the day went. Phase D stores one real end-of-day summary per Employee per working date and one real learning log per Intern per working date so engagement later is counted from actual writes, not invented scores.

## What Changes

- Employee can submit an end-of-day summary: work completed, challenges, general progress, planned work for the next day. Stored against the employee and working date.
- Intern can submit a daily learning log: what they learned, activities, challenges, skills gained, areas to improve. Stored against the intern and working date.
- Project Head can view learning logs for interns relevant to their assigned projects (interns who have tasks on those projects).
- Unique `(user, work_date)` for each log type so dashboards can show submitted vs not without duplicate rows.
- No fake summaries or logs. Empty lists use empty-state copy.

Depends on Phase A. Project Head intern-log visibility depends on Phase C assignments. Out of scope: dashboards and composite engagement scores.

## Capabilities

### New Capabilities

- `employee-daily-summaries`: Employee EOD fields, one per working date, empty-state when none.
- `intern-learning-logs`: Intern daily learning fields, one per working date, Project Head read for relevant interns.

### Modified Capabilities

- None.

## Impact

- Two new tables with RLS (author writes own; Project Head reads relevant intern logs; Admin may read for later analytics).
- Employee and Intern submit screens; Project Head intern-log view.
- Phase E will treat “engagement” as counts of these real rows plus presence/tasks, not a made-up index.
