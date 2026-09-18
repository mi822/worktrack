-- Restore token-based QR presence recording alongside dashboard record_presence().
-- Overload: public.record_presence(text) for QR scans; public.record_presence() unchanged.

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
