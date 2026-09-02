-- Phase D: employee end-of-day summaries and intern learning logs.
-- No seeded summaries or logs. work_date is the calendar date in the
-- schedule timezone (Africa/Douala if hours are unset).

create table public.employee_daily_summaries (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  work_date date not null,
  work_completed text not null,
  challenges text not null,
  general_progress text not null,
  planned_next_day text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint employee_daily_summaries_user_date_unique unique (user_id, work_date),
  constraint employee_daily_summaries_work_completed_check
    check (char_length(trim(work_completed)) > 0),
  constraint employee_daily_summaries_challenges_check
    check (char_length(trim(challenges)) > 0),
  constraint employee_daily_summaries_progress_check
    check (char_length(trim(general_progress)) > 0),
  constraint employee_daily_summaries_planned_check
    check (char_length(trim(planned_next_day)) > 0)
);

create index employee_daily_summaries_user_id_idx
  on public.employee_daily_summaries (user_id);
create index employee_daily_summaries_work_date_idx
  on public.employee_daily_summaries (work_date);

create table public.intern_learning_logs (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  work_date date not null,
  learned text not null,
  activities text not null,
  challenges text not null,
  skills_gained text not null,
  areas_to_improve text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint intern_learning_logs_user_date_unique unique (user_id, work_date),
  constraint intern_learning_logs_learned_check
    check (char_length(trim(learned)) > 0),
  constraint intern_learning_logs_activities_check
    check (char_length(trim(activities)) > 0),
  constraint intern_learning_logs_challenges_check
    check (char_length(trim(challenges)) > 0),
  constraint intern_learning_logs_skills_check
    check (char_length(trim(skills_gained)) > 0),
  constraint intern_learning_logs_improve_check
    check (char_length(trim(areas_to_improve)) > 0)
);

create index intern_learning_logs_user_id_idx
  on public.intern_learning_logs (user_id);
create index intern_learning_logs_work_date_idx
  on public.intern_learning_logs (work_date);

create or replace function private.head_can_read_intern(p_intern_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.tasks t
    join public.projects p on p.id = t.project_id
    where t.assignee_id = p_intern_id
      and p.project_head_id = (select auth.uid())
  )
$$;

revoke all on function private.head_can_read_intern(uuid) from public;
grant execute on function private.head_can_read_intern(uuid) to authenticated;

create or replace function private.employee_summaries_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  author_role public.app_role;
begin
  select pr.role into author_role
  from public.profiles pr
  where pr.id = new.user_id
    and pr.is_active;

  if author_role is distinct from 'employee' then
    raise exception 'employee_summary_role' using errcode = '23514';
  end if;

  if tg_op = 'UPDATE' then
    if new.user_id is distinct from old.user_id
       or new.work_date is distinct from old.work_date then
      raise exception 'employee_summary_identity_immutable' using errcode = '23514';
    end if;
    new.updated_at := now();
  end if;

  return new;
end;
$$;

revoke all on function private.employee_summaries_guard() from public;

create trigger employee_summaries_guard
  before insert or update on public.employee_daily_summaries
  for each row
  execute function private.employee_summaries_guard();

create or replace function private.intern_logs_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  author_role public.app_role;
begin
  select pr.role into author_role
  from public.profiles pr
  where pr.id = new.user_id
    and pr.is_active;

  if author_role is distinct from 'intern' then
    raise exception 'intern_log_role' using errcode = '23514';
  end if;

  if tg_op = 'UPDATE' then
    if new.user_id is distinct from old.user_id
       or new.work_date is distinct from old.work_date then
      raise exception 'intern_log_identity_immutable' using errcode = '23514';
    end if;
    new.updated_at := now();
  end if;

  return new;
end;
$$;

revoke all on function private.intern_logs_guard() from public;

create trigger intern_logs_guard
  before insert or update on public.intern_learning_logs
  for each row
  execute function private.intern_logs_guard();

alter table public.employee_daily_summaries enable row level security;
alter table public.employee_daily_summaries force row level security;
alter table public.intern_learning_logs enable row level security;
alter table public.intern_learning_logs force row level security;

create policy employee_summaries_select_own_or_admin
  on public.employee_daily_summaries
  for select
  to authenticated
  using (
    user_id = (select auth.uid())
    or (select private.get_my_role()) = 'admin'
  );

create policy employee_summaries_insert_own
  on public.employee_daily_summaries
  for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and (select private.get_my_role()) = 'employee'
  );

create policy employee_summaries_update_own
  on public.employee_daily_summaries
  for update
  to authenticated
  using (
    user_id = (select auth.uid())
    and (select private.get_my_role()) = 'employee'
  )
  with check (
    user_id = (select auth.uid())
    and (select private.get_my_role()) = 'employee'
  );

create policy intern_logs_select_own_head_or_admin
  on public.intern_learning_logs
  for select
  to authenticated
  using (
    user_id = (select auth.uid())
    or (select private.get_my_role()) = 'admin'
    or private.head_can_read_intern(user_id)
  );

create policy intern_logs_insert_own
  on public.intern_learning_logs
  for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and (select private.get_my_role()) = 'intern'
  );

create policy intern_logs_update_own
  on public.intern_learning_logs
  for update
  to authenticated
  using (
    user_id = (select auth.uid())
    and (select private.get_my_role()) = 'intern'
  )
  with check (
    user_id = (select auth.uid())
    and (select private.get_my_role()) = 'intern'
  );

grant select, insert, update on table public.employee_daily_summaries to authenticated;
grant usage, select on sequence public.employee_daily_summaries_id_seq to authenticated;
grant select, insert, update on table public.intern_learning_logs to authenticated;
grant usage, select on sequence public.intern_learning_logs_id_seq to authenticated;
