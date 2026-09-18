-- Project/task documents and private Storage bucket. No seed files.

create table public.documents (
  id bigint generated always as identity primary key,
  storage_path text not null unique,
  file_name text not null,
  mime_type text not null,
  byte_size integer not null,
  uploaded_by uuid not null references public.profiles (id) on delete restrict,
  project_id bigint not null references public.projects (id) on delete cascade,
  task_id bigint references public.tasks (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint documents_file_name_check check (
    char_length(trim(file_name)) > 0 and char_length(file_name) <= 200
  ),
  constraint documents_mime_check check (char_length(mime_type) between 3 and 120),
  constraint documents_size_check check (byte_size > 0 and byte_size <= 10485760)
);

create index documents_project_id_idx on public.documents (project_id);
create index documents_task_id_idx on public.documents (task_id);
create index documents_uploaded_by_idx on public.documents (uploaded_by);

create or replace function private.documents_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  task_project bigint;
begin
  if new.uploaded_by is distinct from (select auth.uid())
     and (select private.get_my_role()) is distinct from 'admin' then
    raise exception 'uploader_must_be_self' using errcode = '42501';
  end if;

  if new.task_id is not null then
    select t.project_id into task_project
    from public.tasks t
    where t.id = new.task_id;

    if task_project is null or task_project is distinct from new.project_id then
      raise exception 'document_task_project' using errcode = '23514';
    end if;

    if not private.can_write_task_document(new.task_id) then
      raise exception 'document_task_forbidden' using errcode = '42501';
    end if;
  else
    if not private.can_write_project_document(new.project_id) then
      raise exception 'document_project_forbidden' using errcode = '42501';
    end if;
  end if;

  return new;
end;
$$;

revoke all on function private.documents_guard() from public;

create trigger documents_guard
  before insert on public.documents
  for each row
  execute function private.documents_guard();

alter table public.documents enable row level security;
alter table public.documents force row level security;

create policy documents_select
  on public.documents
  for select
  to authenticated
  using (private.can_access_project(project_id));

create policy documents_insert
  on public.documents
  for insert
  to authenticated
  with check (
    uploaded_by = (select auth.uid())
    and (
      (task_id is null and private.can_write_project_document(project_id))
      or (task_id is not null and private.can_write_task_document(task_id))
    )
  );

create policy documents_delete
  on public.documents
  for delete
  to authenticated
  using (
    (select private.get_my_role()) = 'admin'
    or uploaded_by = (select auth.uid())
    or private.can_write_project_document(project_id)
  );

grant select, insert, delete on table public.documents to authenticated;
grant usage, select on sequence public.documents_id_seq to authenticated;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'worktrack-documents',
  'worktrack-documents',
  false,
  10485760,
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'image/jpeg',
    'image/png',
    'image/webp',
    'text/plain'
  ]
);

create or replace function private.storage_project_id(p_name text)
returns bigint
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  folder text;
begin
  folder := (storage.foldername(p_name))[1];
  if folder ~ '^[0-9]+$' then
    return folder::bigint;
  end if;
  return null;
end;
$$;

create or replace function private.storage_task_id(p_name text)
returns bigint
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  parts text[];
begin
  parts := storage.foldername(p_name);
  if coalesce(parts[2], '') = 'task' and coalesce(parts[3], '') ~ '^[0-9]+$' then
    return parts[3]::bigint;
  end if;
  return null;
end;
$$;

revoke all on function private.storage_project_id(text) from public;
revoke all on function private.storage_task_id(text) from public;
grant execute on function private.storage_project_id(text) to authenticated;
grant execute on function private.storage_task_id(text) to authenticated;

create policy worktrack_documents_select
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'worktrack-documents'
    and private.can_access_project(private.storage_project_id(name))
  );

create policy worktrack_documents_insert
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'worktrack-documents'
    and (
      (
        (storage.foldername(name))[2] = 'project'
        and private.can_write_project_document(private.storage_project_id(name))
      )
      or (
        (storage.foldername(name))[2] = 'task'
        and private.can_write_task_document(private.storage_task_id(name))
      )
    )
  );

create policy worktrack_documents_delete
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'worktrack-documents'
    and (
      (select private.get_my_role()) = 'admin'
      or owner_id = (select auth.uid())::text
      or private.can_write_project_document(private.storage_project_id(name))
    )
  );
