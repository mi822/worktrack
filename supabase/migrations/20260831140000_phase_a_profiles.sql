-- Phase A: exclusive roles, profiles, RLS. No sample users or org rows.

create type public.app_role as enum (
  'intern',
  'employee',
  'project_head',
  'manager',
  'admin'
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  role public.app_role not null default 'intern',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create or replace function private.get_my_role()
returns public.app_role
language sql
stable
security definer
set search_path = ''
as $$
  select role
  from public.profiles
  where id = (select auth.uid())
$$;

revoke all on function private.get_my_role() from public;
grant execute on function private.get_my_role() to authenticated;

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_role public.app_role := 'intern';
begin
  if new.raw_app_meta_data ? 'role'
     and (new.raw_app_meta_data->>'role') in (
       'intern', 'employee', 'project_head', 'manager', 'admin'
     )
  then
    new_role := (new.raw_app_meta_data->>'role')::public.app_role;
  end if;

  insert into public.profiles (id, full_name, role, is_active)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data->>'full_name', ''),
      split_part(coalesce(new.email, ''), '@', 1)
    ),
    new_role,
    true
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke all on function private.handle_new_user() from public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function private.handle_new_user();

alter table public.profiles enable row level security;
alter table public.profiles force row level security;

create policy profiles_select_self_or_admin
  on public.profiles
  for select
  to authenticated
  using (
    id = (select auth.uid())
    or (select private.get_my_role()) = 'admin'
  );

create policy profiles_update_admin
  on public.profiles
  for update
  to authenticated
  using ((select private.get_my_role()) = 'admin')
  with check ((select private.get_my_role()) = 'admin');

grant select, update on table public.profiles to authenticated;
