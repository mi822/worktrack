-- Admin org-wide reads for dashboards. Owner/head/assignee policies are unchanged.

create policy projects_select_admin
  on public.projects
  for select
  to authenticated
  using ((select private.get_my_role()) = 'admin');

create policy tasks_select_admin
  on public.tasks
  for select
  to authenticated
  using ((select private.get_my_role()) = 'admin');
