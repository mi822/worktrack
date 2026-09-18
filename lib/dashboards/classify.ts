import { isWorkingDay } from "@/lib/logs/work-date";
import type { WorkSchedule } from "@/lib/presence/types";
import type { AppRole } from "@/lib/types";
import type { ProjectListItem, ProjectProgress, TaskListItem, TaskStatus } from "@/lib/work/types";
import { emptyTaskStatusCounts } from "@/lib/work/types";

export const SCANNER_ROLES: AppRole[] = [
  "manager",
  "project_head",
  "employee",
  "intern",
];

export function isProjectCompleted(
  project: Pick<ProjectListItem, "status"> | ProjectProgress,
): boolean {
  if ("status" in project) {
    return project.status === "closed";
  }
  return project.total > 0 && project.byStatus.approved === project.total;
}

export function isProjectOverdue(
  deadline: string,
  workDate: string,
  completed: boolean,
): boolean {
  return !completed && deadline < workDate;
}

export function projectBucket(
  project: Pick<ProjectListItem, "deadline" | "progress" | "status">,
  workDate: string,
): "completed" | "overdue" | "active" {
  if (isProjectCompleted(project)) {
    return "completed";
  }
  if (isProjectOverdue(project.deadline, workDate, false)) {
    return "overdue";
  }
  return "active";
}

export function summarizeProjects(
  projects: Pick<ProjectListItem, "deadline" | "progress" | "status">[],
  workDate: string,
): {
  total: number;
  active: number;
  completed: number;
  overdue: number;
} {
  let completed = 0;
  let overdue = 0;
  for (const project of projects) {
    const bucket = projectBucket(project, workDate);
    if (bucket === "completed") {
      completed += 1;
    } else if (bucket === "overdue") {
      overdue += 1;
    }
  }
  const total = projects.length;
  return {
    total,
    completed,
    overdue,
    active: total - completed,
  };
}

export function mergeTaskStatusCounts(
  projects: Pick<ProjectListItem, "progress">[],
): Record<TaskStatus, number> {
  const counts = emptyTaskStatusCounts();
  for (const project of projects) {
    for (const status of Object.keys(counts) as TaskStatus[]) {
      counts[status] += project.progress.byStatus[status];
    }
  }
  return counts;
}

export function taskTotal(counts: Record<TaskStatus, number>): number {
  return Object.values(counts).reduce((sum, value) => sum + value, 0);
}

export function attendancePercent(
  present: number,
  late: number,
  expected: number,
): number | null {
  if (expected <= 0) {
    return null;
  }
  return Math.round(((present + late) / expected) * 1000) / 10;
}

export function formatPercent(value: number | null): string | null {
  if (value === null) {
    return null;
  }
  return Number.isInteger(value) ? `${value}%` : `${value.toFixed(1)}%`;
}

export function attentionTasks(
  tasks: TaskListItem[],
  workDate: string,
): TaskListItem[] {
  return tasks
    .filter(
      (task) =>
        task.status === "submitted" ||
        task.status === "under_review" ||
        (task.deadline < workDate && task.status !== "approved"),
    )
    .sort((a, b) => a.deadline.localeCompare(b.deadline))
    .slice(0, 8);
}

export function expectedScannerCount(input: {
  schedule: WorkSchedule | null;
  workDate: string;
  activeScannerCount: number;
}): { hoursConfigured: boolean; isWorkDay: boolean; expected: number } {
  if (!input.schedule) {
    return { hoursConfigured: false, isWorkDay: false, expected: 0 };
  }
  const isWorkDay = isWorkingDay(input.schedule, input.workDate);
  return {
    hoursConfigured: true,
    isWorkDay,
    expected: isWorkDay ? input.activeScannerCount : 0,
  };
}
