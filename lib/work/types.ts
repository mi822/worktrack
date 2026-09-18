export const TASK_STATUSES = [
  "created",
  "assigned",
  "in_progress",
  "submitted",
  "under_review",
  "approved",
  "rejected",
] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_PRIORITIES = ["low", "medium", "high"] as const;

export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export const TASK_STATUS_LABEL: Record<TaskStatus, string> = {
  created: "Created",
  assigned: "Assigned",
  in_progress: "In Progress",
  submitted: "Submitted",
  under_review: "Under Review",
  approved: "Approved",
  rejected: "Rejected",
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

export const PROJECT_STATUSES = [
  "active",
  "pending_closure",
  "closed",
] as const;

export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const PROJECT_STATUS_LABEL: Record<ProjectStatus, string> = {
  active: "Active",
  pending_closure: "Submitted to manager",
  closed: "Closed",
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
  status: ProjectStatus;
  submitted_for_closure_at: string | null;
  closed_at: string | null;
};

export function isProjectStatus(value: string): value is ProjectStatus {
  return (PROJECT_STATUSES as readonly string[]).includes(value);
}

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
    created: 0,
    assigned: 0,
    in_progress: 0,
    submitted: 0,
    under_review: 0,
    approved: 0,
    rejected: 0,
  };
}

export function isTaskStatus(value: string): value is TaskStatus {
  return (TASK_STATUSES as readonly string[]).includes(value);
}

export function isTaskPriority(value: string): value is TaskPriority {
  return (TASK_PRIORITIES as readonly string[]).includes(value);
}
