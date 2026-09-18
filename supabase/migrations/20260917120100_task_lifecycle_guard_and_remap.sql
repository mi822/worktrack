-- Remap legacy statuses, rewrite transition guard, update related RLS.
-- Requires 20260917120000_task_lifecycle_enum_values (committed).

alter table public.tasks disable trigger tasks_status_guard;

update public.tasks
set status = 'assigned'
where status = 'pending';

update public.tasks
set status = 'submitted'
where status = 'resubmitted';

alter table public.tasks enable trigger tasks_status_guard;

alter table public.tasks
  alter column status set default 'assigned';

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

  -- Project head: Created → Assigned (reserved for future unassigned create)
  if old.status = 'created' and new.status = 'assigned' then
    if not private.is_project_head(old.project_id) then
      raise exception 'task_head_only' using errcode = '42501';
    end if;
    return new;
  end if;

  -- Assignee: Assigned → In Progress
  if old.status = 'assigned' and new.status = 'in_progress' then
    if caller is distinct from old.assignee_id then
      raise exception 'task_assignee_only' using errcode = '42501';
    end if;
    return new;
  end if;

  -- Assignee: In Progress → Submitted (submission row required)
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

  -- Project head: Submitted → Under Review
  if old.status = 'submitted' and new.status = 'under_review' then
    if not private.is_project_head(old.project_id) then
      raise exception 'task_head_only' using errcode = '42501';
    end if;
    return new;
  end if;

  -- Project head: Under Review → Approved | Rejected
  if old.status = 'under_review'
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

  -- Assignee: Rejected → In Progress (resume work)
  if old.status = 'rejected' and new.status = 'in_progress' then
    if caller is distinct from old.assignee_id then
      raise exception 'task_assignee_only' using errcode = '42501';
    end if;
    return new;
  end if;

  raise exception 'invalid_status_transition' using errcode = '23514';
end;
$$;

drop policy if exists task_submissions_insert_assignee on public.task_submissions;
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
        and t.status = 'in_progress'
    )
  );

drop policy if exists task_feedback_insert_head on public.task_feedback;
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
        and t.status = 'under_review'
    )
  );
