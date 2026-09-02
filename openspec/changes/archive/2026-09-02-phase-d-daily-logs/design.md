## Context

Depends on Phase A; intern-log visibility for heads depends on Phase C task assignments. Working date SHOULD use the Phase B schedule timezone when Phase B is applied; if hours are unset, use a single documented server timezone for the date key rather than inventing a fake schedule row.

## Goals / Non-Goals

**Goals:**

- One EOD summary per employee per date; one learning log per intern per date.
- Head can read logs only for interns with tasks on their projects.

**Non-Goals:**

- Composite engagement scores, dashboards, seeding sample logs.
- Manager-wide log browsing.

## Decisions

### Decision: Unique `(user_id, work_date)` on both tables

Employee summaries: four text fields. Intern logs: five text fields. Unique constraint matches presence so “submitted today” is a row existence check.

**Why:** Spec associates each artifact with person + working date; dashboards need a boolean status.

**Alternatives considered:** Unlimited logs per day (dashboards could not show a single status).

### Decision: Update in place vs insert-only

Allow the author to update today’s row; forbid a second insert. Unique violation maps to update-or-error.

**Why:** Duplicate rows would break Phase E counts.

### Decision: Relevant intern = assignee on head’s projects

`project_head_id` on projects plus `tasks.assignee_id` where assignee role is intern. RLS or a view implements that filter.

**Why:** Spec says “relevant interns” without another org chart.

## Risks / Trade-offs

- [Phase B not applied] → Mitigation: still store `work_date` as date; document timezone source.
- [Intern with tasks on two heads] → Mitigation: each head who has a task assignment to that intern may read the log.

## Migration Plan

1. Apply after A (and C for head visibility).
2. Add the two tables + unique indexes + RLS.
3. Rollback: drop those tables.

## Open Questions

None.
