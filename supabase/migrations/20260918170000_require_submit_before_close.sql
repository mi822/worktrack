-- Require head "Submit to manager" before the manager can close.

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
