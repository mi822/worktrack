export const TASK_STATUSES = [
  "pending",
  "in_progress",
  "submitted",
  "approved",
  "rejected",
  "resubmitted",
] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_PRIORITIES = ["low", "medium", "high"] as const;

export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export const TASK_STATUS_LABEL: Record<TaskStatus, string> = {
  pending: "Pending",
  in_progress: "In progress",
  submitted: "Submitted",
  approved: "Approved",
  rejected: "Rejected",
  resubmitted: "Resubmitted",
};

export const TASK_PRIORITY_LABEL: Record<TaskPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

export type NamedProfile = {
  id: string;
  full_name: string;
};

export type ProjectRecord = {
  id: number;
  manager_id: string;
  project_head_id: string | null;
  title: string;
  description: string;
  start_date: string;
  deadline: string;
  budget: string;
};

export type ProjectProgress = {
  total: number;
  byStatus: Record<TaskStatus, number>;
};

export type ProjectListItem = ProjectRecord & {
  head_name: string | null;
  progress: ProjectProgress;
};

export type TaskRecord = {
  id: number;
  project_id: number;
  assignee_id: string;
  created_by: string;
  description: string;
  priority: TaskPriority;
  deadline: string;
  status: TaskStatus;
  created_at: string;
  updated_at: string;
};

export type TaskListItem = TaskRecord & {
  assignee_name: string | null;
  project_title: string | null;
};

export type TaskSubmissionRecord = {
  id: number;
  notes: string;
  created_at: string;
};

export type TaskFeedbackRecord = {
  id: number;
  reason: string;
  created_at: string;
};

export type TaskFeedbackListItem = TaskFeedbackRecord & {
  task_id: number;
  task_description: string;
};

export function emptyTaskStatusCounts(): Record<TaskStatus, number> {
  return {
    pending: 0,
    in_progress: 0,
    submitted: 0,
    approved: 0,
    rejected: 0,
    resubmitted: 0,
  };
}

export function isTaskStatus(value: string): value is TaskStatus {
  return (TASK_STATUSES as readonly string[]).includes(value);
}

export function isTaskPriority(value: string): value is TaskPriority {
  return (TASK_PRIORITIES as readonly string[]).includes(value);
}
