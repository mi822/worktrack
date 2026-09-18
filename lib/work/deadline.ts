import { isDeadlineApproaching } from "@/lib/notifications/reminders-pure";
import type { TaskStatus } from "@/lib/work/types";

export const DUE_SOON_DAYS = 2;

export const DEADLINE_STATES = [
  "on_time",
  "due_soon",
  "overdue",
  "completed",
] as const;

export type DeadlineState = (typeof DEADLINE_STATES)[number];

export const DEADLINE_STATE_LABEL: Record<DeadlineState, string> = {
  on_time: "On Time",
  due_soon: "Due Soon",
  overdue: "Overdue",
  completed: "Completed",
};

/** Lightweight deadline bucket for display — no stored column / background job. */
export function deadlineState(
  deadline: string,
  status: TaskStatus,
  today: string,
  dueSoonDays = DUE_SOON_DAYS,
): DeadlineState {
  if (status === "approved") {
    return "completed";
  }
  if (deadline < today) {
    return "overdue";
  }
  if (isDeadlineApproaching(deadline, today, dueSoonDays)) {
    return "due_soon";
  }
  return "on_time";
}

export function isTaskOverdue(
  deadline: string,
  status: TaskStatus,
  today: string,
): boolean {
  return deadlineState(deadline, status, today) === "overdue";
}
