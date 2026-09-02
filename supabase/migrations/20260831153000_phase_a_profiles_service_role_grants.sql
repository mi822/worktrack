-- Admin user-management uses the service_role key against PostgREST.
-- Phase A only granted SELECT/UPDATE to authenticated, so profile updates
-- after auth.admin.createUser failed with permission denied.

grant select, insert, update on table public.profiles to service_role;
