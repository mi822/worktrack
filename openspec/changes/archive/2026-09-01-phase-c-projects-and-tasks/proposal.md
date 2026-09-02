## Why

Presence alone does not allocate work. Phase C adds projects owned by Managers and tasks owned by Project Heads so Employees and Interns receive, update, submit, and get review on real assignments.

## What Changes

- Manager creates/edits/views their projects: description, start date, deadline, budget; assigns exactly one Project Head; monitors progress derived from that project’s tasks. A Manager only manages projects they own.
- Project Head sees only assigned projects; creates tasks; assigns each task to one Employee or one Intern; sets description, priority, deadline; monitors progress; reviews submissions.
- Task workflow: Pending → In Progress → Submitted → Approved. On reject: … → Rejected (with feedback) → Resubmitted → Approved.
- Employees and Interns see only tasks assigned to them; update status; submit; view feedback; resubmit after rejection.
- Only the Project Head of the task’s project can approve or reject.
- No fake projects or tasks. Empty lists use empty-state copy.

Depends on Phase A. Independent of Phase B at the data level (work can exist without a scan). Out of scope: daily summaries, intern learning logs, role analytics dashboards.

## Capabilities

### New Capabilities

- `projects`: Manager project lifecycle, one Project Head per project, ownership isolation, progress from child tasks.
- `tasks`: Task create/assign, status workflow, submit/review/approve/reject/feedback, assignee-only access.

### Modified Capabilities

- None.

## Impact

- New `projects`, `tasks`, `task_submissions`, and `task_feedback` tables with RLS for manager/head/assignee isolation.
- Manager, Project Head, Employee, and Intern work screens (not full analytics dashboards).
- Phase E will aggregate task/project counts from these tables.
