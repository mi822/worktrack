-- Atomic reject so Project Head / Manager rejection always applies:
-- insert feedback + set status=rejected in one transaction.

create or replace function public.reject_task(p_task_id bigint, p_reason text)
returns table (ok boolean, code text)
language plpgsql
security invoker
set search_path = public
as $$
declare
  caller uuid := auth.uid();
  task_row public.tasks%rowtype;
  clean_reason text := trim(coalesce(p_reason, ''));
begin
  if caller is null then
    return query select false, 'not_authenticated';
    return;
  end if;

  if char_length(clean_reason) = 0 then
    return query select false, 'feedback_required';
    return;
  end if;

  select * into task_row
  from public.tasks t
  where t.id = p_task_id
  for update;

  if not found then
    return query select false, 'not_found';
    return;
  end if;

  if not (
    private.is_project_head(task_row.project_id)
    or private.is_project_manager(task_row.project_id)
  ) then
    return query select false, 'task_head_only';
    return;
  end if;

  if task_row.status not in ('submitted', 'under_review') then
    return query select false, 'invalid_status_transition';
    return;
  end if;

  insert into public.task_feedback (task_id, reviewer_id, reason)
  values (task_row.id, caller, clean_reason);

  update public.tasks
  set status = 'rejected'
  where id = task_row.id;

  return query select true, 'rejected';
end;
$$;

revoke all on function public.reject_task(bigint, text) from public;
grant execute on function public.reject_task(bigint, text) to authenticated;
