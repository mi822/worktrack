-- Allow project managers (owners) to review tasks alongside project heads.
-- Also allow direct submitted → approved|rejected (no mandatory Start review).

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

  -- Project head: Created → Assigned
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

  -- Assignee: In Progress → Submitted
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

  -- Head or manager: Submitted → Under Review
  if old.status = 'submitted' and new.status = 'under_review' then
    if not (
      private.is_project_head(old.project_id)
      or private.is_project_manager(old.project_id)
    ) then
      raise exception 'task_head_only' using errcode = '42501';
    end if;
    return new;
  end if;

  -- Head or manager: Submitted → Approved | Rejected (direct)
  if old.status = 'submitted'
     and new.status in ('approved', 'rejected') then
    if not (
      private.is_project_head(old.project_id)
      or private.is_project_manager(old.project_id)
    ) then
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

  -- Head or manager: Under Review → Approved | Rejected
  if old.status = 'under_review'
     and new.status in ('approved', 'rejected') then
    if not (
      private.is_project_head(old.project_id)
      or private.is_project_manager(old.project_id)
    ) then
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

  -- Assignee: Rejected → In Progress
  if old.status = 'rejected' and new.status = 'in_progress' then
    if caller is distinct from old.assignee_id then
      raise exception 'task_assignee_only' using errcode = '42501';
    end if;
    return new;
  end if;

  raise exception 'invalid_status_transition' using errcode = '23514';
end;
$$;

drop policy if exists tasks_update_assignee_or_head on public.tasks;
create policy tasks_update_assignee_or_head
  on public.tasks
  for update
  to authenticated
  using (
    assignee_id = (select auth.uid())
    or private.is_project_head(project_id)
    or private.is_project_manager(project_id)
  )
  with check (
    assignee_id = (select auth.uid())
    or private.is_project_head(project_id)
    or private.is_project_manager(project_id)
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
        and (
          private.is_project_head(t.project_id)
          or private.is_project_manager(t.project_id)
        )
        and t.status in ('submitted', 'under_review')
    )
  );
