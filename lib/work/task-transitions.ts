import type { TaskStatus } from "@/lib/work/types";

const TRANSITIONS: Partial<Record<TaskStatus, readonly TaskStatus[]>> = {
  created: ["assigned"],
  assigned: ["in_progress"],
  in_progress: ["submitted"],
  submitted: ["under_review", "approved", "rejected"],
  under_review: ["approved", "rejected"],
  rejected: ["in_progress"],
  approved: [],
};

export function canTransition(
  from: TaskStatus,
  to: TaskStatus,
): boolean {
  return (TRANSITIONS[from] ?? []).includes(to);
}
