-- Owning manager can delete a project. Tasks, submissions, feedback, and
-- document rows cascade; Storage files are removed by the server action.

create policy projects_delete_owner
  on public.projects
  for delete
  to authenticated
  using (manager_id = (select auth.uid()));

grant delete on table public.projects to authenticated;
