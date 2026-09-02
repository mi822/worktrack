## Context

Greenfield repo (OpenSpec plus skills only; no application code). Empty connected Postgres. See `proposal.md` for why Phase A exists and `specs/accounts-and-roles/spec.md` for behavior. Constraints: one organization, no dummy data, five exclusive roles, Admin-only account creation.

## Goals / Non-Goals

**Goals:**

- One Next.js App Router TypeScript app with cookie sessions and RLS that matches the five exclusive roles.
- Admin can create every other account without public signup.
- Role homes exist as empty shells so later phases attach widgets without moving routes.

**Non-Goals:**

- Hours, QR, presence, projects, tasks, logs, analytics.
- Multi-tenant orgs, stacked roles, OAuth social login.
- Seeding demo users or sample organizational rows in migrations.

## Decisions

### Decision: Next.js App Router + TypeScript + Supabase

Use Next.js App Router, `@supabase/ssr` cookie sessions, Supabase Auth (email/password), Postgres, and RLS.

**Why:** Server-side session for protected routes; service role stays on the server for user create and password reset; a WorkTrack Supabase project already exists and is empty.

**Alternatives considered:** Vite SPA + client-only supabase-js (weaker session story; service role would leak if used from the browser).

### Decision: Exclusive role on `profiles.role`

Postgres enum `app_role`: `intern | employee | project_head | manager | admin`. One `profiles` row per `auth.users` id (`id`, `full_name`, `role`, `is_active`). Trigger on `auth.users` insert creates a profile. A security-definer `get_my_role()` drives RLS. Role MUST NOT be stored in user-editable `user_metadata`.

**Why:** Spec forbids stacked roles; RLS stays a single enum check; user_metadata is spoofable.

**Alternatives considered:** `user_roles` join table (only needed for stacked roles); role only in JWT `app_metadata` without a profile row (harder to list/filter users).

### Decision: Disable Auth sign-ups; admin creates users on the server

Turn off public sign-up. A server action, callable only when `get_my_role() = admin`, uses the service-role key to `auth.admin.createUser` / password update, then writes `profiles`. The service-role key MUST NOT appear in client bundles or `NEXT_PUBLIC_` env vars.

**Why:** Spec requires no self-registration and admin-managed credentials.

**Alternatives considered:** Invite-link emails only (still needs admin trigger; slower for the first real users).

### Decision: One out-of-band bootstrap Admin

Create exactly one real Admin in the Auth dashboard (or a documented one-time operator SQL/Auth step) with a matching `profiles` row. The application MUST NOT seed Jane/John demo users or one account per role.

**Why:** Empty-database policy plus admin-only creation is otherwise a deadlock.

**Alternatives considered:** First-run setup wizard (extra product surface the spec did not ask for); seed five demo roles (forbidden).

### Decision: Deactivate via `profiles.is_active`

Deactivate sets `is_active = false`. Middleware checks `is_active` on every request. Do not delete `auth.users` (later presence/task history would break). Self-role-change is rejected in the admin update path by comparing target id to the caller.

**Why:** Spec requires deactivated users cannot use the app and an admin cannot change their own role.

### Decision: Route map (Phase A)

| Route | Roles |
|-------|--------|
| `/login` | public |
| `/` | signed-in role home shell |
| `/admin/users` | admin |

Middleware: unauthenticated → `/login`; non-admin → deny `/admin/*`. Nav shows only links the role may use.

**Why:** Matches Phase A pages; later phases add scan, projects, and dashboard widgets on these homes.

### Decision: RLS sketch

- `profiles`: user selects own row; admin selects/updates all.
- No authenticated-wide select of all profiles in this phase (Employee does not need a people directory yet).

## Risks / Trade-offs

- [Service role leaked to the client] → Mitigation: import the admin client only in server modules; never `NEXT_PUBLIC_` for the service key.
- [Bootstrap Admin forgotten] → Mitigation: document the one-time Auth dashboard step in tasks; app still shows empty lists for roles with no rows.
- [Deactivated user keeps an old cookie] → Mitigation: middleware checks `is_active` on every request.

## Migration Plan

1. Scaffold the Next.js app; gitignore `.env.local` (URL, publishable/anon key, server-only service role).
2. Apply Phase A SQL: enum, `profiles`, trigger, RLS, `get_my_role()`.
3. Disable public sign-up; create one bootstrap Admin in Auth + matching profile.
4. Remaining roles are created only from `/admin/users`.
5. Rollback on an empty project: drop `profiles` and `app_role`; do not reset a shared production project casually.

## Open Questions

None that affect this slice. Schedule, QR, and dashboards stay in later phases.
