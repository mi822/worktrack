## Why

WorkTrack cannot allocate work, record presence, or show engagement until every person has exactly one role, can sign in, and lands on a home they are allowed to use. Phase A is that foundation: identity and admin account management first, so later phases attach real people instead of stubs.

## What Changes

- Greenfield Next.js web app with email/password sign-in; unauthenticated visitors go to login.
- Five exclusive roles: `admin`, `manager`, `project_head`, `employee`, `intern` (one role per account).
- Admin creates, edits, activates/deactivates accounts, assigns roles, and sets/resets passwords. Other roles cannot manage users. A user cannot change their own role.
- Public self-registration is disabled. Only Admin creates Manager, Project Head, Employee, and Intern accounts.
- After sign-in, each role opens its own dashboard shell. Non-admins cannot open admin pages or admin APIs.
- Empty lists show empty-state copy (for example “No users found.”). No demo users, fake org data, or placeholder counts.

Out of scope for this phase: working hours, QR, presence, projects, tasks, daily summaries, intern logs, analytics widgets beyond an empty role home.

## Capabilities

### New Capabilities

- `accounts-and-roles`: Sign-in, exclusive roles, admin-only account lifecycle (create, edit, activate/deactivate, role and password management), role-based routing and API denial, empty-state user lists.

### Modified Capabilities

- None. There are no main specs yet; this is the first slice.

## Impact

- New web application (repo currently has no product code).
- Supabase Auth (email/password), Postgres `profiles`, Row Level Security, server-only service role for admin user create/password reset.
- One out-of-band bootstrap Admin (Auth dashboard or documented operator step) so the empty-database rule can still allow the first login. The app does not seed demo users.
- Later phases depend on `profiles` and role homes; they are not built here.
