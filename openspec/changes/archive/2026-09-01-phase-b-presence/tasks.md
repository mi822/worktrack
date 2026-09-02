## 1. Work schedule

- [x] 1.1 Add `work_schedules` singleton (working days, start, end, late_threshold_minutes, optional break, timezone) with RLS and no seeded hours, and verify the table exists with RLS enabled and zero default time rows
- [x] 1.2 Build `/admin/hours` so admin can save and reload a complete schedule, and verify saving Monday–Friday 09:00–18:00 with 15 minutes grace persists after reload
- [x] 1.3 Reject invalid ranges (end not after start, negative grace), refuse the page and updates for non-admin roles, show “working hours not configured” when the row is missing, and verify a manager cannot change hours

## 2. QR codes

- [x] 2.1 Add `qr_codes` (payload/secret, validity window, is_active, created_by) so activating one deactivates others, and verify two generate-and-activate steps leave only one active row
- [x] 2.2 Build admin QR management (generate, activate, deactivate, optional validity, display the code) and verify a project head cannot deactivate the code

## 3. Presence recording

- [x] 3.1 Add `presence` with unique `(user_id, work_date)`, status enum, `qr_code_id`, and a server RPC that validates the active in-window token, computes work_date in the schedule timezone, sets Present/Late from the late threshold, and verify a first scan inserts exactly one row with the right status
- [x] 3.2 Map unique-violation and existing-row to “Your presence has already been recorded for today.”, refuse scans when hours are unset or the QR is inactive/expired, refuse admin as a scanner, and verify a second scan does not insert a second row
- [x] 3.3 Build the signed-in scanner page for manager, project_head, employee, and intern; hide it after a successful record for that working date; omit Mark as Present and any periodic recheck; and verify the camera flow records one row then shows the already-recorded message

## 4. Admin presence list

- [x] 4.1 Show admin a list of real presence rows (user, date, time, status, QR) or “No attendance records available.”, and verify an empty database shows the empty state and one real scan appears after it happens

## 5. Phase B walkthrough

- [x] 5.1 Walk login → scan active QR → Present/Late row → second scan blocked, and verify it matches `work-schedule` and `qr-presence`
