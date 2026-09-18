export const NOTIFICATION_KINDS = [
  "task_assigned",
  "task_submitted",
  "task_approved",
  "task_rejected",
  "project_assigned",
  "project_submitted",
  "project_closed",
  "deadline_task",
  "deadline_project",
  "reminder_activity",
] as const;

export type NotificationKind = (typeof NOTIFICATION_KINDS)[number];

export type NotificationRow = {
  id: number;
  kind: NotificationKind;
  title: string;
  body: string;
  href: string;
  read_at: string | null;
  created_at: string;
};

export function isNotificationKind(value: string): value is NotificationKind {
  return (NOTIFICATION_KINDS as readonly string[]).includes(value);
}
