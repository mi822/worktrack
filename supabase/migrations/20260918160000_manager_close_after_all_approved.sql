-- Manager closes once every task is approved by the project head.
-- Last approval marks the project pending_closure automatically.

create or replace function public.sync_project_closure_readiness(p_project_id bigint)
returns table (ok boolean, code text, became_ready boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  caller uuid := auth.uid();
  project_row public.projects%rowtype;
  open_tasks int;
  task_count int;
begin
  if caller is null then
    return query select false, 'not_authenticated', false;
    return;
  end if;

  select * into project_row
  from public.projects p
  where p.id = p_project_id
  for update;

  if not found then
    return query select false, 'not_found', false;
    return;
  end if;

  if not (
    project_row.project_head_id is not distinct from caller
    or project_row.manager_id is not distinct from caller
  ) then
    return query select false, 'not_allowed', false;
    return;
  end if;

  if project_row.status = 'closed' then
    return query select true, 'closed', false;
    return;
  end if;

  select
    count(*)::int,
    count(*) filter (where t.status is distinct from 'approved')::int
  into task_count, open_tasks
  from public.tasks t
  where t.project_id = project_row.id;

  if task_count > 0 and open_tasks = 0 then
    if project_row.status is distinct from 'pending_closure' then
      update public.projects
      set
        status = 'pending_closure',
        submitted_for_closure_at = coalesce(submitted_for_closure_at, now())
      where id = project_row.id;
      return query select true, 'ready', true;
      return;
    end if;
    return query select true, 'ready', false;
    return;
  end if;

  if project_row.status = 'pending_closure' then
    update public.projects
    set
      status = 'active',
      submitted_for_closure_at = null
    where id = project_row.id;
  end if;

  return query select true, 'active', false;
end;
$$;

create or replace function public.close_project(p_project_id bigint)
returns table (ok boolean, code text)
language plpgsql
security definer
set search_path = public
as $$
declare
  caller uuid := auth.uid();
  project_row public.projects%rowtype;
  open_tasks int;
  task_count int;
begin
  if caller is null then
    return query select false, 'not_authenticated';
    return;
  end if;

  select * into project_row
  from public.projects p
  where p.id = p_project_id
  for update;

  if not found then
    return query select false, 'not_found';
    return;
  end if;

  if project_row.manager_id is distinct from caller then
    return query select false, 'manager_only';
    return;
  end if;

  if project_row.status = 'closed' then
    return query select false, 'invalid_status';
    return;
  end if;

  select
    count(*)::int,
    count(*) filter (where t.status is distinct from 'approved')::int
  into task_count, open_tasks
  from public.tasks t
  where t.project_id = project_row.id;

  if task_count = 0 then
    return query select false, 'no_tasks';
    return;
  end if;

  if open_tasks > 0 then
    return query select false, 'tasks_incomplete';
    return;
  end if;

  update public.projects
  set
    status = 'closed',
    closed_at = now()
  where id = project_row.id;

  return query select true, 'closed';
end;
$$;

revoke all on function public.sync_project_closure_readiness(bigint) from public;
grant execute on function public.sync_project_closure_readiness(bigint) to authenticated;
