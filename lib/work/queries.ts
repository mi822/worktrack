import { createClient } from "@/lib/supabase/server";
import {
  isTaskPriority,
  isTaskStatus,
  TASK_STATUS_LABEL,
  type NamedProfile,
  type ProjectListItem,
  type ProjectProgress,
  type ProjectRecord,
  type TaskFeedbackRecord,
  type TaskListItem,
  type TaskRecord,
  type TaskFeedbackListItem,
  type TaskStatus,
  type TaskSubmissionRecord,
  emptyTaskStatusCounts,
} from "@/lib/work/types";

function asProject(row: {
  id: number | string;
  manager_id: string;
  project_head_id: string | null;
  title: string;
  description: string;
  start_date: string;
  deadline: string;
  budget: number | string;
}): ProjectRecord {
  return {
    id: Number(row.id),
    manager_id: row.manager_id,
    project_head_id: row.project_head_id,
    title: row.title,
    description: row.description,
    start_date: row.start_date,
    deadline: row.deadline,
    budget: String(row.budget),
  };
}

function asTask(row: {
  id: number | string;
  project_id: number | string;
  assignee_id: string;
  created_by: string;
  description: string;
  priority: string;
  deadline: string;
  status: string;
  created_at: string;
  updated_at: string;
}): TaskRecord | null {
  if (!isTaskPriority(row.priority) || !isTaskStatus(row.status)) {
    return null;
  }
  return {
    id: Number(row.id),
    project_id: Number(row.project_id),
    assignee_id: row.assignee_id,
    created_by: row.created_by,
    description: row.description,
    priority: row.priority,
    deadline: row.deadline,
    status: row.status,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function emptyStatusCounts(): Record<TaskStatus, number> {
  return emptyTaskStatusCounts();
}

function progressFromTasks(
  projectId: number,
  tasks: { project_id: number; status: string }[],
): ProjectProgress {
  const mine = tasks.filter((task) => task.project_id === projectId);
  const byStatus = emptyStatusCounts();
  for (const task of mine) {
    if (isTaskStatus(task.status)) {
      byStatus[task.status] += 1;
    }
  }
  return {
    total: mine.length,
    byStatus,
  };
}

async function namesById(ids: string[]): Promise<Map<string, string>> {
  const unique = [...new Set(ids.filter(Boolean))];
  const map = new Map<string, string>();
  if (unique.length === 0) {
    return map;
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name")
    .in("id", unique);

  for (const row of data ?? []) {
    map.set(row.id, row.full_name);
  }
  return map;
}

export async function listAssignableHeads(): Promise<NamedProfile[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("role", "project_head")
    .eq("is_active", true)
    .order("full_name");

  return (data ?? []).map((row) => ({
    id: row.id,
    full_name: row.full_name,
  }));
}

export async function listAssignableWorkers(): Promise<NamedProfile[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .in("role", ["employee", "intern"])
    .eq("is_active", true)
    .order("full_name");

  return (data ?? []).map((row) => ({
    id: row.id,
    full_name: row.full_name,
  }));
}

export async function listProjects(): Promise<ProjectListItem[]> {
  const supabase = await createClient();
  const { data: projectRows, error } = await supabase
    .from("projects")
    .select(
      "id, manager_id, project_head_id, title, description, start_date, deadline, budget",
    )
    .order("deadline");

  if (error || !projectRows) {
    return [];
  }

  const projects = projectRows.map(asProject);
  const ids = projects.map((project) => project.id);
  let taskRows: { project_id: number; status: string }[] = [];
  if (ids.length > 0) {
    const { data } = await supabase
      .from("tasks")
      .select("project_id, status")
      .in("project_id", ids);
    taskRows = (data ?? []).map((row) => ({
      project_id: Number(row.project_id),
      status: row.status,
    }));
  }

  const names = await namesById(
    projects
      .map((project) => project.project_head_id)
      .filter((id): id is string => Boolean(id)),
  );

  return projects.map((project) => ({
    ...project,
    head_name: project.project_head_id
      ? (names.get(project.project_head_id) ?? null)
      : null,
    progress: progressFromTasks(project.id, taskRows),
  }));
}

export async function getProject(
  id: number,
): Promise<ProjectListItem | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select(
      "id, manager_id, project_head_id, title, description, start_date, deadline, budget",
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const project = asProject(data);
  const { data: taskRows } = await supabase
    .from("tasks")
    .select("project_id, status")
    .eq("project_id", id);
  const names = await namesById(
    project.project_head_id ? [project.project_head_id] : [],
  );

  return {
    ...project,
    head_name: project.project_head_id
      ? (names.get(project.project_head_id) ?? null)
      : null,
    progress: progressFromTasks(
      project.id,
      (taskRows ?? []).map((row) => ({
        project_id: Number(row.project_id),
        status: row.status,
      })),
    ),
  };
}

export async function listProjectTasks(projectId: number): Promise<TaskListItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .select(
      "id, project_id, assignee_id, created_by, description, priority, deadline, status, created_at, updated_at",
    )
    .eq("project_id", projectId)
    .order("deadline");

  if (error || !data) {
    return [];
  }

  const tasks = data.map(asTask).filter((row): row is TaskRecord => row !== null);
  const names = await namesById(tasks.map((task) => task.assignee_id));
  return tasks.map((task) => ({
    ...task,
    assignee_name: names.get(task.assignee_id) ?? null,
    project_title: null,
  }));
}

export async function listAssignedTasks(userId: string): Promise<TaskListItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .select(
      "id, project_id, assignee_id, created_by, description, priority, deadline, status, created_at, updated_at",
    )
    .eq("assignee_id", userId)
    .order("deadline");

  if (error || !data) {
    return [];
  }

  const tasks = data.map(asTask).filter((row): row is TaskRecord => row !== null);
  const projectIds = [...new Set(tasks.map((task) => task.project_id))];
  const titles = new Map<number, string>();
  if (projectIds.length > 0) {
    const { data: projects } = await supabase
      .from("projects")
      .select("id, title")
      .in("id", projectIds);
    for (const row of projects ?? []) {
      titles.set(Number(row.id), row.title);
    }
  }

  return tasks.map((task) => ({
    ...task,
    assignee_name: null,
    project_title: titles.get(task.project_id) ?? null,
  }));
}

export async function getTask(id: number): Promise<TaskListItem | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .select(
      "id, project_id, assignee_id, created_by, description, priority, deadline, status, created_at, updated_at",
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const task = asTask(data);
  if (!task) {
    return null;
  }

  const names = await namesById([task.assignee_id]);
  const { data: project } = await supabase
    .from("projects")
    .select("id, title")
    .eq("id", task.project_id)
    .maybeSingle();

  return {
    ...task,
    assignee_name: names.get(task.assignee_id) ?? null,
    project_title: project?.title ?? null,
  };
}

export async function listTaskSubmissions(
  taskId: number,
): Promise<TaskSubmissionRecord[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("task_submissions")
    .select("id, notes, created_at")
    .eq("task_id", taskId)
    .order("created_at", { ascending: false });

  return (data ?? []).map((row) => ({
    id: Number(row.id),
    notes: row.notes,
    created_at: row.created_at,
  }));
}

export async function listFeedbackForAssignee(
  userId: string,
): Promise<TaskFeedbackListItem[]> {
  const supabase = await createClient();
  const { data: tasks, error } = await supabase
    .from("tasks")
    .select("id, description")
    .eq("assignee_id", userId);

  if (error || !tasks || tasks.length === 0) {
    return [];
  }

  const titles = new Map(
    tasks.map((task) => [Number(task.id), task.description]),
  );
  const ids = [...titles.keys()];
  const { data } = await supabase
    .from("task_feedback")
    .select("id, task_id, reason, created_at")
    .in("task_id", ids)
    .order("created_at", { ascending: false });

  return (data ?? []).map((row) => ({
    id: Number(row.id),
    task_id: Number(row.task_id),
    reason: row.reason,
    created_at: row.created_at,
    task_description: titles.get(Number(row.task_id)) ?? "Task",
  }));
}

export async function listTaskFeedback(
  taskId: number,
): Promise<TaskFeedbackRecord[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("task_feedback")
    .select("id, reason, created_at")
    .eq("task_id", taskId)
    .order("created_at", { ascending: false });

  return (data ?? []).map((row) => ({
    id: Number(row.id),
    reason: row.reason,
    created_at: row.created_at,
  }));
}

const PROGRESS_STATUSES: TaskStatus[] = [
  "pending",
  "in_progress",
  "submitted",
  "approved",
];

export function progressCopy(progress: ProjectProgress): string {
  const parts = PROGRESS_STATUSES.map(
    (status) => `${TASK_STATUS_LABEL[status]} ${progress.byStatus[status]}`,
  );
  if (progress.byStatus.rejected > 0) {
    parts.push(`${TASK_STATUS_LABEL.rejected} ${progress.byStatus.rejected}`);
  }
  if (progress.byStatus.resubmitted > 0) {
    parts.push(
      `${TASK_STATUS_LABEL.resubmitted} ${progress.byStatus.resubmitted}`,
    );
  }
  return parts.join(" · ");
}
