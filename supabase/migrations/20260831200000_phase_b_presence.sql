-- Phase B: work schedule, QR codes, presence. No seeded hours or attendance.

create type public.presence_status as enum ('present', 'late');

create table public.work_schedules (
  id integer primary key check (id = 1),
  monday boolean not null default false,
  tuesday boolean not null default false,
  wednesday boolean not null default false,
  thursday boolean not null default false,
  friday boolean not null default false,
  saturday boolean not null default false,
  sunday boolean not null default false,
  work_start time not null,
  work_end time not null,
  late_threshold_minutes integer not null,
  break_start time,
  break_end time,
  timezone text not null,
  updated_at timestamptz not null default now(),
  constraint work_schedules_range_check check (work_end > work_start),
  constraint work_schedules_grace_check check (late_threshold_minutes >= 0),
  constraint work_schedules_timezone_check check (char_length(timezone) > 0),
  constraint work_schedules_days_check check (
    monday or tuesday or wednesday or thursday or friday or saturday or sunday
  ),
  constraint work_schedules_break_check check (
    (break_start is null and break_end is null)
    or (
      break_start is not null
      and break_end is not null
      and break_end > break_start
    )
  )
);

create table public.qr_codes (
  id bigint generated always as identity primary key,
  token text not null,
  valid_from timestamptz not null default now(),
  valid_until timestamptz,
  is_active boolean not null default false,
  created_by uuid not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint qr_codes_token_unique unique (token),
  constraint qr_codes_window_check check (
    valid_until is null or valid_until > valid_from
  )
);

create index qr_codes_created_by_idx on public.qr_codes (created_by);
create index qr_codes_active_idx on public.qr_codes (is_active) where is_active;

create table public.presence (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  work_date date not null,
  scanned_at timestamptz not null default now(),
  status public.presence_status not null,
  qr_code_id bigint not null references public.qr_codes (id) on delete restrict,
  constraint presence_user_work_date_unique unique (user_id, work_date)
);

create index presence_qr_code_id_idx on public.presence (qr_code_id);
create index presence_work_date_idx on public.presence (work_date);

create or replace function private.qr_codes_single_active()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.is_active then
    update public.qr_codes
    set is_active = false
    where id is distinct from new.id
      and is_active;
  end if;
  return new;
end;
$$;

revoke all on function private.qr_codes_single_active() from public;

create trigger qr_codes_single_active
  before insert or update of is_active on public.qr_codes
  for each row
  when (new.is_active)
  execute function private.qr_codes_single_active();

create or replace function private.record_presence(p_token text)
returns table(ok boolean, code text, status public.presence_status)
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
  caller_role public.app_role;
  sched public.work_schedules%rowtype;
  qr public.qr_codes%rowtype;
  local_ts timestamp;
  work_d date;
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

  if p_token is null or char_length(trim(p_token)) = 0 then
    return query select false, 'invalid_qr'::text, null::public.presence_status;
    return;
  end if;

  select * into sched from public.work_schedules where id = 1;
  if not found then
    return query select false, 'hours_not_configured'::text, null::public.presence_status;
    return;
  end if;

  select * into qr
  from public.qr_codes
  where token = trim(p_token)
    and is_active
    and now() >= valid_from
    and (valid_until is null or now() <= valid_until);

  if not found then
    return query select false, 'invalid_qr'::text, null::public.presence_status;
    return;
  end if;

  local_ts := timezone(sched.timezone, now());
  work_d := local_ts::date;
  local_t := local_ts::time;
  late_at := (sched.work_start + make_interval(mins => sched.late_threshold_minutes))::time;

  if local_t <= late_at then
    new_status := 'present';
  else
    new_status := 'late';
  end if;

  insert into public.presence (user_id, work_date, scanned_at, status, qr_code_id)
  values (caller, work_d, now(), new_status, qr.id);

  return query select true, 'recorded'::text, new_status;
exception
  when unique_violation then
    return query select false, 'already_recorded'::text, null::public.presence_status;
end;
$$;

revoke all on function private.record_presence(text) from public;
grant execute on function private.record_presence(text) to authenticated;

create or replace function public.record_presence(p_token text)
returns table(ok boolean, code text, status public.presence_status)
language sql
security invoker
set search_path = ''
as $$
  select * from private.record_presence(p_token);
$$;

revoke all on function public.record_presence(text) from public;
grant execute on function public.record_presence(text) to authenticated;

alter table public.work_schedules enable row level security;
alter table public.work_schedules force row level security;
alter table public.qr_codes enable row level security;
alter table public.qr_codes force row level security;
alter table public.presence enable row level security;
alter table public.presence force row level security;

create policy work_schedules_select_authenticated
  on public.work_schedules
  for select
  to authenticated
  using (true);

create policy work_schedules_insert_admin
  on public.work_schedules
  for insert
  to authenticated
  with check ((select private.get_my_role()) = 'admin');

create policy work_schedules_update_admin
  on public.work_schedules
  for update
  to authenticated
  using ((select private.get_my_role()) = 'admin')
  with check ((select private.get_my_role()) = 'admin');

create policy qr_codes_admin_all
  on public.qr_codes
  for all
  to authenticated
  using ((select private.get_my_role()) = 'admin')
  with check ((select private.get_my_role()) = 'admin');

create policy presence_select_own_or_admin
  on public.presence
  for select
  to authenticated
  using (
    user_id = (select auth.uid())
    or (select private.get_my_role()) = 'admin'
  );

grant select, insert, update on table public.work_schedules to authenticated;
grant select, insert, update on table public.qr_codes to authenticated;
grant usage, select on sequence public.qr_codes_id_seq to authenticated;
grant select on table public.presence to authenticated;
grant usage, select on sequence public.presence_id_seq to authenticated;
