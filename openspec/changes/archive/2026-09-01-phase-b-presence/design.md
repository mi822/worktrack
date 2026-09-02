## Context

Depends on Phase A (`profiles`, roles, admin-only APIs). See `proposal.md` for why. Empty database besides real users created in A. No dummy attendance.

## Goals / Non-Goals

**Goals:**

- Persist one org schedule (including timezone and working days) without seeding sample hours.
- Versioned QR with at most one active code; scan writes one presence row per user per working date.
- Compute Present/Late on insert; uniqueness at the database.

**Non-Goals:**

- Clock-out, GPS, kiosk hardware, multiple scans per day, Absent rows, dashboards.
- Seeding 08:30–17:00 or any sample presence.

## Decisions

### Decision: Singleton `work_schedules` with no seed row

One row (`id = 1`) holding `working_days` (seven booleans or an equivalent weekday set), `work_start`, `work_end`, `late_threshold_minutes` (minutes after start), optional `break_start`/`break_end`, `timezone` (IANA, stored — not taken from the browser). Do not INSERT defaults in the migration. Presence insert is refused until the row is complete.

**Why:** Spec forbids hardcoded sample org information; late threshold stays consistent when start time changes.

**Alternatives considered:** Seed 08:30/17:00/10 (forbidden); late threshold as an absolute clock time (breaks when start moves).

### Decision: Break is stored, unused by scan

Optional break fields are saved if the admin sets them. Presence remains one scan per day; break MUST NOT trigger a second scan.

**Why:** Spec allows break “if required” but forbids multiple daily scans.

### Decision: Versioned `qr_codes`

Each generate creates a row (`id`, secret/payload, `valid_from`, `valid_until` nullable, `is_active`, `created_by`). Activating one deactivates others. Payload is an opaque token, not a static public string. Scan must match an active, in-window row.

**Why:** Generate/activate/deactivate/validity; a photographed static string would outlive deactivation.

**Alternatives considered:** Single mutable QR row (harder to know which code a historical presence used); public org name as payload (forgeable).

### Decision: `presence` unique `(user_id, work_date)`

Columns: `user_id`, `work_date` (date in schedule timezone), `scanned_at` timestamptz, `status` enum `present | late`, `qr_code_id`. Unique index on `(user_id, work_date)`. Insert via a server path that validates QR, computes `work_date` and status, catches unique violation as “already recorded.” Admin is not insertable as a scanner.

**Why:** Spec requires DB-level one row per user per day.

**Alternatives considered:** UI-only guard (racy); storing Absent rows (spec says absence is lack of a scan).

### Decision: Scanner is a signed-in page, one shot

Non-admin roles get a scanner screen. After a successful insert (or unique hit), hide the scanner for that working date. No interval timers, no continuous camera loop after success, no “Mark as Present.”

**Why:** Spec forbids rechecking and manual mark.

### Decision: RLS

- `work_schedules`: authenticated select; admin update/insert.
- `qr_codes`: admin full; authenticated may only read what the scan RPC needs (prefer RPC so secrets never go to the client).
- `presence`: user inserts own via RPC; user selects own; admin selects all.

Prefer a security-definer RPC `record_presence(token)` over direct client inserts so QR secrets stay off the client.

## Risks / Trade-offs

- [Timezone mismatch] → Mitigation: compute `work_date` in stored IANA timezone, never `Date.now()` local browser date alone.
- [QR token leaked in client] → Mitigation: scan submits token to RPC; listing QR for admin can show the image without embedding the secret in employee bundles.
- [Hours unset] → Mitigation: RPC returns a configuration error; UI empty state.

## Migration Plan

1. Apply after Phase A.
2. Add `work_schedules`, `qr_codes`, `presence` + unique index + RPC.
3. Rollback: drop those objects; do not delete `profiles`.

## Open Questions

None that block this phase. Dashboard Absent counts wait for Phase E.
