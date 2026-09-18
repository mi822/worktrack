-- In-app notifications. No seeded rows.

create table public.notifications (
  id bigint generated always as identity primary key,
  recipient_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null,
  title text not null,
  body text not null,
  href text not null,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  constraint notifications_kind_check check (
    kind in (
      'task_assigned',
      'task_submitted',
      'task_approved',
      'task_rejected',
      'project_assigned'
    )
  ),
  constraint notifications_title_check check (
    char_length(trim(title)) > 0 and char_length(title) <= 160
  ),
  constraint notifications_body_check check (
    char_length(trim(body)) > 0 and char_length(body) <= 400
  ),
  constraint notifications_href_check check (
    href like '/%' and href not like '//%' and char_length(href) <= 240
  )
);

create index notifications_recipient_created_idx
  on public.notifications (recipient_id, created_at desc);

create or replace function private.notify(
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

  if p_recipient_id is null or p_recipient_id = (select auth.uid()) then
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
  );
end;
$$;

revoke all on function private.notify(uuid, text, text, text, text) from public;
grant execute on function private.notify(uuid, text, text, text, text) to authenticated;

create or replace function public.notify_user(
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
  select private.notify(p_recipient_id, p_kind, p_title, p_body, p_href);
$$;

revoke all on function public.notify_user(uuid, text, text, text, text) from public;
grant execute on function public.notify_user(uuid, text, text, text, text) to authenticated;

alter table public.notifications enable row level security;
alter table public.notifications force row level security;

create policy notifications_select_own
  on public.notifications
  for select
  to authenticated
  using (recipient_id = (select auth.uid()));

create policy notifications_update_own
  on public.notifications
  for update
  to authenticated
  using (recipient_id = (select auth.uid()))
  with check (recipient_id = (select auth.uid()));

grant select, update on table public.notifications to authenticated;
grant usage, select on sequence public.notifications_id_seq to authenticated;
