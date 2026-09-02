## Context

Last slice. Reads tables from Phases A–D. Phase A homes become these dashboards. See `proposal.md`. No dummy analytics.

## Goals / Non-Goals

**Goals:**

- Replace role shells with live aggregates and empty states.
- Document derivation for Absent, completed/overdue, engagement-as-counts.
- Close-out security/permission checks across roles.

**Non-Goals:**

- New write APIs, new entities, composite “engagement score,” charts that need fake series.

## Decisions

### Decision: Engagement is three real series, not one score

Admin “employee engagement” shows: share of employees with an EOD summary today (or in a stated window), presence rate, approved-task counts. No weighted index.

**Why:** Spec asked for engagement information without a formula; inventing a score would be dummy analytics.

### Decision: Absent = expected scanners minus presence rows

Expected = active profiles with role in (manager, project_head, employee, intern) on a configured working day. Admin excluded. Do not insert Absent rows.

**Why:** Matches one-scan-per-day presence model.

### Decision: Completed / overdue derived

Completed: `task_count > 0 AND rejected/in-flight count = 0 AND every task approved`. Projects with zero tasks are neither completed nor overdue-as-complete; they are active until deadline then overdue if still taskless (treat taskless after deadline as overdue). Document this in UI copy if needed.

**Why:** Spec listed completed/overdue without a project status column.

### Decision: Queries under RLS, not service-role dashboards

Admin dashboard uses admin-capable selects already granted. Manager/head/employee queries must not use the service role. Prefer SQL views with `security_invoker = true` if views are used.

**Why:** Service role in the browser or in a public dashboard query would bypass isolation.

### Decision: Attendance percentage

`present_plus_late / expected * 100` for today, or empty state if expected is 0. Never a hardcoded 87%.

## Risks / Trade-offs

- [Division by zero] → Mitigation: empty state when expected or total tasks is 0.
- [Hours unset] → Mitigation: today’s presence section shows “working hours not configured” instead of Absent for everyone.

## Migration Plan

1. Apply after A–D.
2. No required new tables; optional invoker views for aggregates.
3. Rollback: revert dashboard UI to shells.

## Open Questions

None. Window for “engagement” defaults to today (same as presence) unless a later change asks for a range.
