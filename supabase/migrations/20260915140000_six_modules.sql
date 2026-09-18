-- Reminder notification kinds. No seed rows.

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
      'deadline_task',
      'deadline_project',
      'reminder_activity'
    )
  );

create unique index notifications_reminder_unique_idx
  on public.notifications (recipient_id, kind, href)
  where kind in ('deadline_task', 'deadline_project', 'reminder_activity');
