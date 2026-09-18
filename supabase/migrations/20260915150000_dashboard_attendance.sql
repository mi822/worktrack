-- Dashboard attendance: admin opens the day; users record from home.
-- Keep existing presence rows and qr_codes. Do not reset data.

alter table public.presence
  alter column qr_code_id drop not null;

create table public.attendance_days (
  work_date date primary key,
  activated_at timestamptz not null default now(),
  activated_by uuid not null references public.profiles (id) on delete restrict,
  closed_at timestamptz,
  closed_by uuid references public.profiles (id) on delete restrict,
  constraint attendance_days_closed_order check (
    closed_at is null or closed_at >= activated_at
  )
);

create index attendance_days_activated_by_idx on public.attendance_days (activated_by);

alter table public.attendance_days enable row level security;
alter table public.attendance_days force row level security;

create policy attendance_days_select_authenticated
  on public.attendance_days
  for select
  to authenticated
  using (true);

grant select on table public.attendance_days to authenticated;

create or replace function private.schedule_work_date()
returns table(sched public.work_schedules, local_ts timestamp, work_d date)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  found_sched public.work_schedules%rowtype;
  ts timestamp;
begin
  select * into found_sched from public.work_schedules where id = 1;
  if not found then
    return;
  end if;
  ts := timezone(found_sched.timezone, now());
  return query select found_sched, ts, ts::date;
end;
$$;

revoke all on function private.schedule_work_date() from public;

create or replace function private.is_schedule_work_day(
  sched public.work_schedules,
  local_ts timestamp
)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select case extract(isodow from local_ts)::integer
    when 1 then sched.monday
    when 2 then sched.tuesday
    when 3 then sched.wednesday
    when 4 then sched.thursday
    when 5 then sched.friday
    when 6 then sched.saturday
    when 7 then sched.sunday
    else false
  end;
$$;

revoke all on function private.is_schedule_work_day(public.work_schedules, timestamp) from public;

drop function if exists public.record_presence(text);
drop function if exists private.record_presence(text);

create or replace function private.activate_todays_attendance()
returns table(ok boolean, code text, work_date date, activated_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
  caller_role public.app_role;
  pack record;
  existing public.attendance_days%rowtype;
  opened_at timestamptz := now();
begin
  if caller is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  select p.role into caller_role
  from public.profiles p
  where p.id = caller
    and p.is_active;

  if caller_role is distinct from 'admin' then
    return query select false, 'not_admin'::text, null::date, null::timestamptz;
    return;
  end if;

  select * into pack from private.schedule_work_date();
  if not found then
    return query select false, 'hours_not_configured'::text, null::date, null::timestamptz;
    return;
  end if;

  if not private.is_schedule_work_day(pack.sched, pack.local_ts) then
    return query select false, 'not_work_day'::text, pack.work_d, null::timestamptz;
    return;
  end if;

  select * into existing
  from public.attendance_days d
  where d.work_date = pack.work_d;

  if found and existing.closed_at is null then
    return query select true, 'already_active'::text, existing.work_date, existing.activated_at;
    return;
  end if;

  if found then
    update public.attendance_days
    set
      activated_at = opened_at,
      activated_by = caller,
      closed_at = null,
      closed_by = null
    where public.attendance_days.work_date = pack.work_d;
  else
    insert into public.attendance_days (work_date, activated_at, activated_by)
    values (pack.work_d, opened_at, caller);
  end if;

  return query select true, 'activated'::text, pack.work_d, opened_at;
end;
$$;

revoke all on function private.activate_todays_attendance() from public;
grant execute on function private.activate_todays_attendance() to authenticated;

create or replace function public.activate_todays_attendance()
returns table(ok boolean, code text, work_date date, activated_at timestamptz)
language sql
security invoker
set search_path = ''
as $$
  select * from private.activate_todays_attendance();
$$;

revoke all on function public.activate_todays_attendance() from public;
grant execute on function public.activate_todays_attendance() to authenticated;

create or replace function private.close_todays_attendance()
returns table(ok boolean, code text, work_date date, closed_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
  caller_role public.app_role;
  pack record;
  existing public.attendance_days%rowtype;
  closed timestamptz := now();
begin
  if caller is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  select p.role into caller_role
  from public.profiles p
  where p.id = caller
    and p.is_active;

  if caller_role is distinct from 'admin' then
    return query select false, 'not_admin'::text, null::date, null::timestamptz;
    return;
  end if;

  select * into pack from private.schedule_work_date();
  if not found then
    return query select false, 'hours_not_configured'::text, null::date, null::timestamptz;
    return;
  end if;

  select * into existing
  from public.attendance_days d
  where d.work_date = pack.work_d;

  if not found then
    return query select false, 'attendance_not_active'::text, pack.work_d, null::timestamptz;
    return;
  end if;

  if existing.closed_at is not null then
    return query select true, 'already_closed'::text, existing.work_date, existing.closed_at;
    return;
  end if;

  update public.attendance_days
  set closed_at = closed, closed_by = caller
  where public.attendance_days.work_date = pack.work_d;

  return query select true, 'closed'::text, pack.work_d, closed;
end;
$$;

revoke all on function private.close_todays_attendance() from public;
grant execute on function private.close_todays_attendance() to authenticated;

create or replace function public.close_todays_attendance()
returns table(ok boolean, code text, work_date date, closed_at timestamptz)
language sql
security invoker
set search_path = ''
as $$
  select * from private.close_todays_attendance();
$$;

revoke all on function public.close_todays_attendance() from public;
grant execute on function public.close_todays_attendance() to authenticated;

create or replace function private.record_presence()
returns table(ok boolean, code text, status public.presence_status)
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
  caller_role public.app_role;
  pack record;
  day_row public.attendance_days%rowtype;
  local_t time;
  late_at time;
  new_status public.presence_status;
begin
  if caller is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  select p.role into caller_role
  from public.profiles p
  where p.id = caller
    and p.is_active;

  if caller_role is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  if caller_role = 'admin' then
    return query select false, 'admin_cannot_scan'::text, null::public.presence_status;
    return;
  end if;

  if caller_role not in ('intern', 'employee', 'project_head', 'manager') then
    return query select false, 'not_eligible'::text, null::public.presence_status;
    return;
  end if;

  select * into pack from private.schedule_work_date();
  if not found then
    return query select false, 'hours_not_configured'::text, null::public.presence_status;
    return;
  end if;

  if not private.is_schedule_work_day(pack.sched, pack.local_ts) then
    return query select false, 'not_work_day'::text, null::public.presence_status;
    return;
  end if;

  select * into day_row
  from public.attendance_days d
  where d.work_date = pack.work_d;

  if not found then
    return query select false, 'attendance_not_active'::text, null::public.presence_status;
    return;
  end if;

  if day_row.closed_at is not null then
    return query select false, 'attendance_closed'::text, null::public.presence_status;
    return;
  end if;

  local_t := pack.local_ts::time;
  late_at := ((pack.sched).work_start + make_interval(mins => (pack.sched).late_threshold_minutes))::time;

  if local_t <= late_at then
    new_status := 'present';
  else
    new_status := 'late';
  end if;

  insert into public.presence (user_id, work_date, scanned_at, status, qr_code_id)
  values (caller, pack.work_d, now(), new_status, null);

  return query select true, 'recorded'::text, new_status;
exception
  when unique_violation then
    return query select false, 'already_recorded'::text, null::public.presence_status;
end;
$$;

revoke all on function private.record_presence() from public;
grant execute on function private.record_presence() to authenticated;

create or replace function public.record_presence()
returns table(ok boolean, code text, status public.presence_status)
language sql
security invoker
set search_path = ''
as $$
  select * from private.record_presence();
$$;

revoke all on function public.record_presence() from public;
grant execute on function public.record_presence() to authenticated;
