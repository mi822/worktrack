import { isTaskPriority, type TaskPriority } from "@/lib/work/types";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function parseIdParam(value: string): number | null {
  if (!/^\d+$/.test(value) || value.length > 15) {
    return null;
  }
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id < 1) {
    return null;
  }
  return id;
}

export function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

export function parseProjectInput(formData: FormData): {
  title: string;
  description: string;
  start_date: string;
  deadline: string;
  budget: number;
  project_head_id: string;
  error: string | null;
} {
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const start_date = String(formData.get("start_date") ?? "").trim();
  const deadline = String(formData.get("deadline") ?? "").trim();
  const budgetRaw = String(formData.get("budget") ?? "").trim();
  const project_head_id = String(formData.get("project_head_id") ?? "").trim();
  const empty = {
    title,
    description,
    start_date,
    deadline,
    budget: 0,
    project_head_id,
    error: "Check the project fields and try again.",
  };

  if (!title || !description) {
    return { ...empty, error: "Title and description are required." };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start_date) || !/^\d{4}-\d{2}-\d{2}$/.test(deadline)) {
    return { ...empty, error: "Start date and deadline are required." };
  }
  if (deadline < start_date) {
    return { ...empty, error: "Deadline must be on or after the start date." };
  }
  const budget = Number(budgetRaw);
  if (!Number.isFinite(budget) || budget < 0) {
    return { ...empty, error: "Budget must be zero or a positive amount." };
  }
  if (!isUuid(project_head_id)) {
    return { ...empty, error: "Choose a project head." };
  }

  return {
    title,
    description,
    start_date,
    deadline,
    budget: Math.round(budget * 100) / 100,
    project_head_id,
    error: null,
  };
}

export function parseTaskInput(formData: FormData): {
  description: string;
  priority: TaskPriority;
  deadline: string;
  assignee_id: string;
  error: string | null;
} {
  const description = String(formData.get("description") ?? "").trim();
  const priorityRaw = String(formData.get("priority") ?? "").trim();
  const deadline = String(formData.get("deadline") ?? "").trim();
  const assignee_id = String(formData.get("assignee_id") ?? "").trim();
  const empty = {
    description,
    priority: "medium" as TaskPriority,
    deadline,
    assignee_id,
    error: "Check the task fields and try again.",
  };

  if (!description) {
    return { ...empty, error: "Description is required." };
  }
  if (!isTaskPriority(priorityRaw)) {
    return { ...empty, error: "Choose a priority." };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(deadline)) {
    return { ...empty, error: "Deadline is required." };
  }
  if (!isUuid(assignee_id)) {
    return { ...empty, error: "Choose an employee or intern." };
  }

  return {
    description,
    priority: priorityRaw,
    deadline,
    assignee_id,
    error: null,
  };
}

export function workActionError(
  fallback: string,
  message: string | undefined,
): string {
  const text = message ?? "";
  if (text.includes("project_head_required")) {
    return "The selected account is not a project head.";
  }
  if (text.includes("task_assignee_role")) {
    return "Tasks can only be assigned to an employee or intern.";
  }
  if (text.includes("feedback_required")) {
    return "A reason is required to reject a task.";
  }
  if (text.includes("submission_required")) {
    return "Submit the work before changing this status.";
  }
  if (text.includes("invalid_status_transition") || text.includes("task_fields_immutable")) {
    return "That status change is not allowed.";
  }
  if (text.includes("task_head_only") || text.includes("task_assignee_only")) {
    return "You are not allowed to do that.";
  }
  return fallback;
}
