## Why

Once people can sign in, WorkTrack still cannot tell who was present. Phase B adds organization working hours and a one-time daily QR scan so presence is a real database row, not a button or a fake attendance feed.

## What Changes

- Admin configures working days, start time, end time, late threshold, and optional break period. Values live in the database and drive presence status. Unset schedule yields an empty/configuration state, not hardcoded hours.
- Admin generates, activates, deactivates, and optionally sets validity on the organization QR code, and can view presence records created by scans.
- Manager, Project Head, Employee, and Intern: log in → open scanner → scan the active QR → backend validates → one presence row for that working day.
- Status is computed from the schedule: on or before the late threshold → Present; after → Late. Record user, date, scan time, status, and QR used.
- A second scan the same working day does not insert another row; the user sees that presence is already recorded. Unique `(user, date)` is enforced in the database.
- Admin does not scan. No multi-scan, continuous scanning, periodic recheck, or “Mark as Present.”
- No fake attendance rows. Empty presence lists use empty-state copy.

Depends on Phase A (`accounts-and-roles`). Out of scope: projects, tasks, daily summaries, intern logs, dashboard analytics.

## Capabilities

### New Capabilities

- `work-schedule`: Admin-managed organization working days, start/end, late threshold, optional break; used by presence status.
- `qr-presence`: Organization QR lifecycle, one successful scan per user per working day, Present/Late from schedule, Admin view of scan records.

### Modified Capabilities

- None. `accounts-and-roles` behavior does not change; presence consumes existing roles.

## Impact

- New tables for schedule, QR codes, and presence; RLS so only allowed roles scan and only Admin manages QR/hours.
- Camera/scanner UI for non-admin roles; Admin QR management screens.
- Timezone and “working date” must be stored with the schedule so “today” is unambiguous.
- Later dashboards will count Present/Late/Absent from these rows; they are not built here.
