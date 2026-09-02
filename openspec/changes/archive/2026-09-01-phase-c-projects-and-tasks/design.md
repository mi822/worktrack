## Context

Depends on Phase A profiles/roles. Independent of Phase B tables. See `proposal.md`. No dummy projects or tasks.

## Goals / Non-Goals

**Goals:**

- Manager-owned projects with exactly one `project_head_id`.
- Tasks with one assignee (employee or intern), status machine including `resubmitted`, submission and feedback history.
- RLS isolating manager/head/assignee.

**Non-Goals:**

- Multiple heads per project, task teams, time tracking, dashboards, daily logs.
- Seed projects or tasks.

## Decisions

### Decision: `projects` owned by manager, one head

Columns include `manager_id`, `project_head_id` (nullable until assigned), `name`/`description`, `start_date`, `deadline`, `budget` (numeric). Manager insert/update only where `manager_id = auth.uid()`. Head select where `project_head_id = auth.uid()`.

**Why:** Spec’s singular “Project → Project Head” plus “only that head can approve.”

**Alternatives considered:** Many-to-many heads (needs extra review rules the spec did not define).

### Decision: Progress is approved_count / total_tasks

No `status` column required on projects for this phase. Completed/overdue labels wait for Phase E (derived: completed = has tasks and all approved, or equivalent documented formula; overdue = deadline before today and not completed).

**Why:** Avoid an extra status the spec did not list; dashboards will derive.

### Decision: `tasks` one assignee, status enum

`status`: `pending | in_progress | submitted | approved | rejected | resubmitted`. `assignee_id` references `profiles`. Assignee must have role employee or intern. Priority: `low | medium | high` (spec did not enumerate; this is the assumption).

**Why:** Matches the written workflow including Resubmitted as a distinct status for “pending reviews.”

### Decision: `task_submissions` and `task_feedback`

Submit writes a submission row (notes optional; no file requirement unless later needed) and sets status `submitted` or `resubmitted`. Reject writes feedback (reason required) and sets `rejected`. Approve sets `approved`. Only the project’s `project_head_id` may review.

**Why:** Entity list includes both tables; history outlives the current status.

### Decision: Allowed status transitions

- Assignee: `pending → in_progress`; `in_progress → submitted`; `rejected → resubmitted` (via submit).
- Head: `submitted|resubmitted → approved`; `submitted|resubmitted → rejected`.
- Enforce in RPC or CHECK + trigger so the client cannot skip review.

## Risks / Trade-offs

- [Head reassigned mid-review] → Mitigation: review checks current `projects.project_head_id` at action time.
- [Budget currency] → Mitigation: numeric amount only; no currency picker unless required later.

## Migration Plan

1. Apply after Phase A (and typically after B, but not required).
2. Add projects/tasks/submissions/feedback + RLS.
3. Rollback: drop those tables.

## Open Questions

None that block the slice. File attachments on submit are not required by the spec and are omitted.
