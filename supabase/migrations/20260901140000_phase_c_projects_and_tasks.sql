-- Phase C: manager-owned projects, head-assigned tasks, submit/review.
-- No seeded projects or tasks.

create type public.task_status as enum (
  'pending',
  'in_progress',
  'submitted',
  'approved',
  'rejected',
  'resubmitted'
);

create type public.task_priority as enum (
  'low',
  'medium',
  'high'
);

create table public.projects (
  id bigint generated always as identity primary key,
  manager_id uuid not null references public.profiles (id) on delete restrict,
  project_head_id uuid references public.profiles (id) on delete restrict,
  title text not null,
  description text not null,
  start_date date not null,
  deadline date not null,
  budget numeric(12, 2) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint projects_title_check check (char_length(trim(title)) > 0),
  constraint projects_description_check check (char_length(trim(description)) > 0),
  constraint projects_dates_check check (deadline >= start_date),
  constraint projects_budget_check check (budget >= 0)
);

create index projects_manager_id_idx on public.projects (manager_id);
create index projects_project_head_id_idx on public.projects (project_head_id);

create table public.tasks (
  id bigint generated always as identity primary key,
  project_id bigint not null references public.projects (id) on delete cascade,
  assignee_id uuid not null references public.profiles (id) on delete restrict,
  created_by uuid not null references public.profiles (id) on delete restrict,
  description text not null,
  priority public.task_priority not null,
  deadline date not null,
  status public.task_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tasks_description_check check (char_length(trim(description)) > 0)
);

create index tasks_project_id_idx on public.tasks (project_id);
create index tasks_assignee_id_idx on public.tasks (assignee_id);
create index tasks_created_by_idx on public.tasks (created_by);
create index tasks_project_id_status_idx on public.tasks (project_id, status);

create table public.task_submissions (
  id bigint generated always as identity primary key,
  task_id bigint not null references public.tasks (id) on delete cascade,
  submitted_by uuid not null references public.profiles (id) on delete restrict,
  notes text not null default '',
  created_at timestamptz not null default now()
);

create index task_submissions_task_id_idx on public.task_submissions (task_id);
create index task_submissions_submitted_by_idx on public.task_submissions (submitted_by);

create table public.task_feedback (
  id bigint generated always as identity primary key,
  task_id bigint not null references public.tasks (id) on delete cascade,
  reviewer_id uuid not null references public.profiles (id) on delete restrict,
  reason text not null,
  created_at timestamptz not null default now(),
  constraint task_feedback_reason_check check (char_length(trim(reason)) > 0)
);

create index task_feedback_task_id_idx on public.task_feedback (task_id);
create index task_feedback_reviewer_id_idx on public.task_feedback (reviewer_id);

create or replace function private.is_project_manager(p_project_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.projects p
    where p.id = p_project_id
      and p.manager_id = (select auth.uid())
  )
$$;

create or replace function private.is_project_head(p_project_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.projects p
    where p.id = p_project_id
      and p.project_head_id = (select auth.uid())
  )
$$;

revoke all on function private.is_project_manager(bigint) from public;
revoke all on function private.is_project_head(bigint) from public;
grant execute on function private.is_project_manager(bigint) to authenticated;
grant execute on function private.is_project_head(bigint) to authenticated;

create or replace function private.projects_role_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  manager_role public.app_role;
  head_role public.app_role;
begin
  select pr.role into manager_role
  from public.profiles pr
  where pr.id = new.manager_id
    and pr.is_active;

  if manager_role is distinct from 'manager' then
    raise exception 'project_manager_required' using errcode = '23514';
  end if;

  if new.project_head_id is not null then
    select pr.role into head_role
    from public.profiles pr
    where pr.id = new.project_head_id
      and pr.is_active;

    if head_role is distinct from 'project_head' then
      raise exception 'project_head_required' using errcode = '23514';
    end if;
  end if;

  if tg_op = 'UPDATE' then
    if new.manager_id is distinct from old.manager_id then
      raise exception 'project_owner_immutable' using errcode = '23514';
    end if;
    new.updated_at := now();
  end if;

  return new;
end;
$$;

revoke all on function private.projects_role_guard() from public;

create trigger projects_role_guard
  before insert or update on public.projects
  for each row
  execute function private.projects_role_guard();

create or replace function private.tasks_role_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  assignee_role public.app_role;
begin
  select pr.role into assignee_role
  from public.profiles pr
  where pr.id = new.assignee_id
    and pr.is_active;

  if assignee_role is distinct from 'employee'
     and assignee_role is distinct from 'intern' then
    raise exception 'task_assignee_role' using errcode = '23514';
  end if;

  if tg_op = 'UPDATE' then
    if new.project_id is distinct from old.project_id
       or new.assignee_id is distinct from old.assignee_id
       or new.created_by is distinct from old.created_by
       or new.description is distinct from old.description
       or new.priority is distinct from old.priority
       or new.deadline is distinct from old.deadline then
      raise exception 'task_fields_immutable' using errcode = '23514';
    end if;
    new.updated_at := now();
  end if;

  return new;
end;
$$;

revoke all on function private.tasks_role_guard() from public;

create trigger tasks_role_guard
  before insert or update on public.tasks
  for each row
  execute function private.tasks_role_guard();

create or replace function private.tasks_status_guard()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
begin
  if new.status is not distinct from old.status then
    return new;
  end if;

  if caller is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  if old.status = 'pending' and new.status = 'in_progress' then
    if caller is distinct from old.assignee_id then
      raise exception 'task_assignee_only' using errcode = '42501';
    end if;
    return new;
  end if;

  if old.status = 'in_progress' and new.status = 'submitted' then
    if caller is distinct from old.assignee_id then
      raise exception 'task_assignee_only' using errcode = '42501';
    end if;
    if not exists (
      select 1
      from public.task_submissions s
      where s.task_id = old.id
        and s.submitted_by = old.assignee_id
        and s.created_at >= old.updated_at
    ) then
      raise exception 'submission_required' using errcode = '23514';
    end if;
    return new;
  end if;

  if old.status = 'rejected' and new.status = 'resubmitted' then
    if caller is distinct from old.assignee_id then
      raise exception 'task_assignee_only' using errcode = '42501';
    end if;
    if not exists (
      select 1
      from public.task_submissions s
      where s.task_id = old.id
        and s.submitted_by = old.assignee_id
        and s.created_at >= old.updated_at
    ) then
      raise exception 'submission_required' using errcode = '23514';
    end if;
    return new;
  end if;

  if old.status in ('submitted', 'resubmitted')
     and new.status in ('approved', 'rejected') then
    if not private.is_project_head(old.project_id) then
      raise exception 'task_head_only' using errcode = '42501';
    end if;
    if new.status = 'rejected' then
      if not exists (
        select 1
        from public.task_feedback f
        where f.task_id = old.id
          and f.reviewer_id = caller
          and f.created_at >= old.updated_at
      ) then
        raise exception 'feedback_required' using errcode = '23514';
      end if;
    end if;
    return new;
  end if;

  raise exception 'invalid_status_transition' using errcode = '23514';
end;
$$;

revoke all on function private.tasks_status_guard() from public;

create trigger tasks_status_guard
  before update of status on public.tasks
  for each row
  execute function private.tasks_status_guard();

create policy profiles_select_assignable
  on public.profiles
  for select
  to authenticated
  using (
    is_active
    and (
      (
        (select private.get_my_role()) = 'manager'
        and role in ('project_head', 'employee', 'intern')
      )
      or (
        (select private.get_my_role()) = 'project_head'
        and role in ('employee', 'intern')
      )
    )
  );

alter table public.projects enable row level security;
alter table public.projects force row level security;
alter table public.tasks enable row level security;
alter table public.tasks force row level security;
alter table public.task_submissions enable row level security;
alter table public.task_submissions force row level security;
alter table public.task_feedback enable row level security;
alter table public.task_feedback force row level security;

create policy projects_select_owner_or_head
  on public.projects
  for select
  to authenticated
  using (
    manager_id = (select auth.uid())
    or project_head_id = (select auth.uid())
  );

create policy projects_insert_manager
  on public.projects
  for insert
  to authenticated
  with check (
    (select private.get_my_role()) = 'manager'
    and manager_id = (select auth.uid())
  );

create policy projects_update_owner
  on public.projects
  for update
  to authenticated
  using (manager_id = (select auth.uid()))
  with check (manager_id = (select auth.uid()));

create policy tasks_select_assignee_head_or_manager
  on public.tasks
  for select
  to authenticated
  using (
    assignee_id = (select auth.uid())
    or private.is_project_head(project_id)
    or private.is_project_manager(project_id)
  );

create policy tasks_insert_head
  on public.tasks
  for insert
  to authenticated
  with check (
    created_by = (select auth.uid())
    and private.is_project_head(project_id)
  );

create policy tasks_update_assignee_or_head
  on public.tasks
  for update
  to authenticated
  using (
    assignee_id = (select auth.uid())
    or private.is_project_head(project_id)
  )
  with check (
    assignee_id = (select auth.uid())
    or private.is_project_head(project_id)
  );

create policy task_submissions_select_related
  on public.task_submissions
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.tasks t
      where t.id = task_id
        and (
          t.assignee_id = (select auth.uid())
          or private.is_project_head(t.project_id)
          or private.is_project_manager(t.project_id)
        )
    )
  );

create policy task_submissions_insert_assignee
  on public.task_submissions
  for insert
  to authenticated
  with check (
    submitted_by = (select auth.uid())
    and exists (
      select 1
      from public.tasks t
      where t.id = task_id
        and t.assignee_id = (select auth.uid())
        and t.status in ('in_progress', 'rejected')
    )
  );

create policy task_feedback_select_related
  on public.task_feedback
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.tasks t
      where t.id = task_id
        and (
          t.assignee_id = (select auth.uid())
          or private.is_project_head(t.project_id)
          or private.is_project_manager(t.project_id)
        )
    )
  );

create policy task_feedback_insert_head
  on public.task_feedback
  for insert
  to authenticated
  with check (
    reviewer_id = (select auth.uid())
    and exists (
      select 1
      from public.tasks t
      where t.id = task_id
        and private.is_project_head(t.project_id)
        and t.status in ('submitted', 'resubmitted')
    )
  );

grant select, insert, update on table public.projects to authenticated;
grant usage, select on sequence public.projects_id_seq to authenticated;
grant select, insert, update on table public.tasks to authenticated;
grant usage, select on sequence public.tasks_id_seq to authenticated;
grant select, insert on table public.task_submissions to authenticated;
grant usage, select on sequence public.task_submissions_id_seq to authenticated;
grant select, insert on table public.task_feedback to authenticated;
grant usage, select on sequence public.task_feedback_id_seq to authenticated;
