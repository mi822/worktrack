-- Fix nested composite field access in record_presence (Present/Late calc).

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
