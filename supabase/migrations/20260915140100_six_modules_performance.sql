-- Access helpers, reminder notify, and performance tables. No dummy reviews.

create or replace function private.notify_once(
  p_recipient_id uuid,
  p_kind text,
  p_title text,
  p_body text,
  p_href text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  if p_recipient_id is null then
    return;
  end if;

  if not exists (
    select 1
    from public.profiles p
    where p.id = p_recipient_id
      and p.is_active
  ) then
    return;
  end if;

  insert into public.notifications (
    recipient_id,
    kind,
    title,
    body,
    href
  )
  values (
    p_recipient_id,
    p_kind,
    trim(p_title),
    trim(p_body),
    p_href
  )
  on conflict (recipient_id, kind, href)
    where kind in ('deadline_task', 'deadline_project', 'reminder_activity')
  do nothing;
end;
$$;

revoke all on function private.notify_once(uuid, text, text, text, text) from public;
grant execute on function private.notify_once(uuid, text, text, text, text) to authenticated;

create or replace function public.notify_user_once(
  p_recipient_id uuid,
  p_kind text,
  p_title text,
  p_body text,
  p_href text
)
returns void
language sql
security invoker
set search_path = ''
as $$
  select private.notify_once(p_recipient_id, p_kind, p_title, p_body, p_href);
$$;

revoke all on function public.notify_user_once(uuid, text, text, text, text) from public;
grant execute on function public.notify_user_once(uuid, text, text, text, text) to authenticated;

create or replace function private.can_access_project(p_project_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    (select private.get_my_role()) = 'admin'
    or exists (
      select 1
      from public.projects p
      where p.id = p_project_id
        and (
          p.manager_id = (select auth.uid())
          or p.project_head_id = (select auth.uid())
        )
    )
    or exists (
      select 1
      from public.tasks t
      where t.project_id = p_project_id
        and t.assignee_id = (select auth.uid())
    )
$$;

create or replace function private.can_review_subject(p_subject_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    (select private.get_my_role()) = 'admin'
    or exists (
      select 1
      from public.projects p
      where p.manager_id = (select auth.uid())
        and (
          p.project_head_id = p_subject_id
          or exists (
            select 1
            from public.tasks t
            where t.project_id = p.id
              and t.assignee_id = p_subject_id
          )
        )
    )
    or exists (
      select 1
      from public.tasks t
      join public.projects p on p.id = t.project_id
      where p.project_head_id = (select auth.uid())
        and t.assignee_id = p_subject_id
    )
$$;

create or replace function private.can_write_project_document(p_project_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    (select private.get_my_role()) = 'admin'
    or private.is_project_manager(p_project_id)
    or private.is_project_head(p_project_id)
$$;

create or replace function private.can_write_task_document(p_task_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.tasks t
    where t.id = p_task_id
      and (
        (select private.get_my_role()) = 'admin'
        or private.is_project_head(t.project_id)
        or t.assignee_id = (select auth.uid())
      )
  )
$$;

revoke all on function private.can_access_project(bigint) from public;
revoke all on function private.can_review_subject(uuid) from public;
revoke all on function private.can_write_project_document(bigint) from public;
revoke all on function private.can_write_task_document(bigint) from public;
grant execute on function private.can_access_project(bigint) to authenticated;
grant execute on function private.can_review_subject(uuid) to authenticated;
grant execute on function private.can_write_project_document(bigint) to authenticated;
grant execute on function private.can_write_task_document(bigint) to authenticated;

create table public.performance_settings (
  id integer primary key check (id = 1),
  w_completion numeric(4, 3) not null default 0.300,
  w_ontime numeric(4, 3) not null default 0.250,
  w_attendance numeric(4, 3) not null default 0.250,
  w_quality numeric(4, 3) not null default 0.100,
  w_participation numeric(4, 3) not null default 0.100,
  updated_at timestamptz not null default now(),
  constraint performance_settings_weights_range check (
    w_completion between 0 and 1
    and w_ontime between 0 and 1
    and w_attendance between 0 and 1
    and w_quality between 0 and 1
    and w_participation between 0 and 1
  ),
  constraint performance_settings_weights_sum check (
    abs(
      w_completion + w_ontime + w_attendance + w_quality + w_participation - 1
    ) < 0.001
  )
);

insert into public.performance_settings (id) values (1);

create table public.performance_reviews (
  id bigint generated always as identity primary key,
  subject_id uuid not null references public.profiles (id) on delete cascade,
  reviewer_id uuid not null references public.profiles (id) on delete restrict,
  period_start date not null,
  period_end date not null,
  rating integer not null,
  comments text not null,
  metrics jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint performance_reviews_period_check check (period_end >= period_start),
  constraint performance_reviews_rating_check check (rating between 1 and 5),
  constraint performance_reviews_comments_check check (
    char_length(trim(comments)) > 0 and char_length(comments) <= 2000
  ),
  constraint performance_reviews_metrics_object check (jsonb_typeof(metrics) = 'object')
);

create index performance_reviews_subject_id_idx
  on public.performance_reviews (subject_id, created_at desc);
create index performance_reviews_reviewer_id_idx
  on public.performance_reviews (reviewer_id);

create or replace function private.performance_reviews_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  subject_role public.app_role;
  reviewer_role public.app_role;
begin
  if (select auth.uid()) is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  if new.reviewer_id is distinct from (select auth.uid()) then
    raise exception 'reviewer_must_be_self' using errcode = '42501';
  end if;

  select pr.role into reviewer_role
  from public.profiles pr
  where pr.id = new.reviewer_id
    and pr.is_active;

  if reviewer_role is distinct from 'manager'
     and reviewer_role is distinct from 'project_head' then
    raise exception 'reviewer_role' using errcode = '42501';
  end if;

  select pr.role into subject_role
  from public.profiles pr
  where pr.id = new.subject_id
    and pr.is_active;

  if subject_role is distinct from 'employee'
     and subject_role is distinct from 'intern' then
    raise exception 'subject_role' using errcode = '23514';
  end if;

  if not private.can_review_subject(new.subject_id) then
    raise exception 'subject_out_of_scope' using errcode = '42501';
  end if;

  return new;
end;
$$;

revoke all on function private.performance_reviews_guard() from public;

create trigger performance_reviews_guard
  before insert on public.performance_reviews
  for each row
  execute function private.performance_reviews_guard();

alter table public.performance_settings enable row level security;
alter table public.performance_settings force row level security;
alter table public.performance_reviews enable row level security;
alter table public.performance_reviews force row level security;

create policy performance_settings_select
  on public.performance_settings
  for select
  to authenticated
  using (true);

create policy performance_settings_update_admin
  on public.performance_settings
  for update
  to authenticated
  using ((select private.get_my_role()) = 'admin')
  with check ((select private.get_my_role()) = 'admin');

create policy performance_reviews_select
  on public.performance_reviews
  for select
  to authenticated
  using (
    subject_id = (select auth.uid())
    or reviewer_id = (select auth.uid())
    or (select private.get_my_role()) = 'admin'
    or private.can_review_subject(subject_id)
  );

create policy performance_reviews_insert
  on public.performance_reviews
  for insert
  to authenticated
  with check (
    reviewer_id = (select auth.uid())
    and (select private.get_my_role()) in ('manager', 'project_head')
    and private.can_review_subject(subject_id)
  );

grant select, update on table public.performance_settings to authenticated;
grant select, insert on table public.performance_reviews to authenticated;
grant usage, select on sequence public.performance_reviews_id_seq to authenticated;
