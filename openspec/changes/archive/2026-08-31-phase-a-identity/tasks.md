## 1. App scaffold

- [x] 1.1 Scaffold a Next.js App Router TypeScript app in the repo with `@supabase/ssr` and `@supabase/supabase-js`, add gitignored `.env.local` for URL, publishable/anon key, and server-only service role, and verify `npm run build` succeeds
- [x] 1.2 Confirm the service role is not prefixed with `NEXT_PUBLIC_` and does not appear in any client module, and verify a search of the source does not expose the service key to the browser

## 2. Schema and bootstrap

- [x] 2.1 Apply Phase A SQL: `app_role` enum, `profiles` (id, full_name, role, is_active), `get_my_role()`, trigger on `auth.users` insert, RLS (own row read; admin all), and verify the table exists in Supabase with RLS enabled
- [x] 2.2 Disable public Auth sign-up, create one active bootstrap admin in Auth with a matching `profiles` row (no demo users of other roles), and verify that admin can authenticate while an unauthenticated sign-up attempt is rejected
- [x] 2.3 Confirm migrations insert no sample managers, employees, projects, or tasks, and verify the user list besides the bootstrap admin is empty

## 3. Sign-in and session

- [x] 3.1 Implement `/login` (email/password) and middleware that redirects unauthenticated users from all other routes to `/login`, and verify a logged-out visit to `/` lands on `/login`
- [x] 3.2 Show a generic sign-in error for bad credentials without saying whether the email exists, and verify a wrong password does not sign in
- [x] 3.3 Block sign-in and ongoing sessions when `profiles.is_active` is false (middleware on every request), and verify a deactivated user cannot use the app even with an old cookie

## 4. Role homes and navigation

- [x] 4.1 Build session + role helpers and a role-aware layout/nav so intern, employee, project_head, manager, and admin each see only their menus, and verify an intern session cannot open `/admin/users`
- [x] 4.2 Route `/` to five role home shells and verify each of the five roles lands on the matching home after sign-in

## 5. Admin user management

- [x] 5.1 Implement `/admin/users` for admin to create accounts (email, initial password, name, role) via a server path that uses the service role only on the server, and verify the new intern can sign in and is treated as intern
- [x] 5.2 Allow admin to update name/role, deactivate accounts, and reset passwords; prevent self-role-change; refuse create/update/deactivate from non-admin callers; and verify a deactivated user cannot sign in, an intern cannot create users, and an admin cannot change their own role
- [x] 5.3 When a role filter has no rows, show "No users found." (or equivalent), and verify the UI does not invent people or counts

## 6. Phase A walkthrough

- [x] 6.1 Walk the Phase A path (bootstrap admin creates a real employee, that employee logs in to their home, they cannot open Users) and verify it matches `accounts-and-roles`
