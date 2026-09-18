-- Project Head submits finished work; Manager closes/terminates the project.

create type public.project_status as enum (
  'active',
  'pending_closure',
  'closed'
);

alter table public.projects
  add column status public.project_status not null default 'active',
  add column submitted_for_closure_at timestamptz,
  add column closed_at timestamptz;

create index projects_status_idx on public.projects (status);

alter table public.notifications
  drop constraint notifications_kind_check;

alter table public.notifications
  add constraint notifications_kind_check check (
    kind in (
      'task_assigned',
      'task_submitted',
      'task_approved',
      'task_rejected',
      'project_assigned',
      'project_submitted',
      'project_closed',
      'deadline_task',
      'deadline_project',
      'reminder_activity'
    )
  );

-- Head cannot UPDATE projects via RLS; use SECURITY DEFINER with auth checks.
create or replace function public.submit_project_for_closure(p_project_id bigint)
returns table (ok boolean, code text)
language plpgsql
security definer
set search_path = public
as $$
declare
  caller uuid := auth.uid();
  project_row public.projects%rowtype;
  open_tasks int;
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

  if project_row.project_head_id is distinct from caller then
    return query select false, 'project_head_only';
    return;
  end if;

  if project_row.status is distinct from 'active' then
    return query select false, 'invalid_status';
    return;
  end if;

  select count(*)::int into open_tasks
  from public.tasks t
  where t.project_id = project_row.id
    and t.status is distinct from 'approved';

  if open_tasks > 0 then
    return query select false, 'tasks_incomplete';
    return;
  end if;

  if not exists (
    select 1 from public.tasks t where t.project_id = project_row.id
  ) then
    return query select false, 'no_tasks';
    return;
  end if;

  update public.projects
  set
    status = 'pending_closure',
    submitted_for_closure_at = now()
  where id = project_row.id;

  return query select true, 'submitted';
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

  if project_row.status is distinct from 'pending_closure' then
    return query select false, 'invalid_status';
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

revoke all on function public.submit_project_for_closure(bigint) from public;
revoke all on function public.close_project(bigint) from public;
grant execute on function public.submit_project_for_closure(bigint) to authenticated;
grant execute on function public.close_project(bigint) to authenticated;
