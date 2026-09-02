import {
  attendancePercent,
  expectedScannerCount,
  mergeTaskStatusCounts,
  SCANNER_ROLES,
  summarizeProjects,
  taskTotal,
} from "@/lib/dashboards/classify";
import type {
  AdminDashboard,
  HeadDashboard,
  ManagerDashboard,
  RoleCount,
  WorkerDashboard,
} from "@/lib/dashboards/types";
import {
  getTodayEmployeeSummary,
  getTodayInternLog,
  listRelevantInternLogs,
} from "@/lib/logs/queries";
import { currentWorkDate } from "@/lib/logs/work-date";
import { getMyPresenceToday } from "@/lib/presence/presence-actions";
import { getWorkSchedule } from "@/lib/presence/schedule";
import {
  requireAdmin,
  requireEmployee,
  requireIntern,
  requireManager,
  requireProjectHead,
} from "@/lib/auth";
import { APP_ROLES, isAppRole } from "@/lib/types";
import { createClient } from "@/lib/supabase/server";
import {
  listAssignedTasks,
  listFeedbackForAssignee,
  listProjects,
} from "@/lib/work/queries";
import {
  emptyTaskStatusCounts,
  isTaskStatus,
  type TaskStatus,
} from "@/lib/work/types";

function emptyRoleCount(): RoleCount {
  return {
    intern: 0,
    employee: 0,
    project_head: 0,
    manager: 0,
    admin: 0,
  };
}

function countsFromTasks(
  tasks: { status: string }[],
): Record<TaskStatus, number> {
  const counts = emptyTaskStatusCounts();
  for (const task of tasks) {
    if (isTaskStatus(task.status)) {
      counts[task.status] += 1;
    }
  }
  return counts;
}

export async function getAdminDashboard(): Promise<AdminDashboard> {
  await requireAdmin();
  const supabase = await createClient();
  const [{ date }, schedule, projects] = await Promise.all([
    currentWorkDate(),
    getWorkSchedule(),
    listProjects(),
  ]);

  const [
    { data: profiles },
    { data: presenceRows },
    { data: summaryRows },
    { data: internLogRows },
  ] = await Promise.all([
    supabase.from("profiles").select("id, role, is_active"),
    supabase.from("presence").select("user_id, status").eq("work_date", date),
    supabase
      .from("employee_daily_summaries")
      .select("user_id")
      .eq("work_date", date),
    supabase.from("intern_learning_logs").select("id, work_date"),
  ]);

  const usersByRole = emptyRoleCount();
  const activeScannerIds = new Set<string>();
  let employeeCount = 0;
  let internCount = 0;
  for (const row of profiles ?? []) {
    if (!isAppRole(row.role)) {
      continue;
    }
    usersByRole[row.role] += 1;
    if (row.is_active && SCANNER_ROLES.includes(row.role)) {
      activeScannerIds.add(row.id);
    }
    if (row.is_active && row.role === "employee") {
      employeeCount += 1;
    }
    if (row.is_active && row.role === "intern") {
      internCount += 1;
    }
  }

  const { hoursConfigured, isWorkDay, expected } = expectedScannerCount({
    schedule,
    workDate: date,
    activeScannerCount: activeScannerIds.size,
  });

  let present = 0;
  let late = 0;
  for (const row of presenceRows ?? []) {
    if (!activeScannerIds.has(row.user_id)) {
      continue;
    }
    if (row.status === "present") {
      present += 1;
    } else if (row.status === "late") {
      late += 1;
    }
  }
  const scanned = present + late;
  const absent = hoursConfigured && isWorkDay ? Math.max(0, expected - scanned) : 0;

  const tasksByStatus = mergeTaskStatusCounts(projects);
  const internLogsToday = (internLogRows ?? []).filter(
    (row) => row.work_date === date,
  ).length;

  return {
    workDate: date,
    userTotal: APP_ROLES.reduce((sum, role) => sum + usersByRole[role], 0),
    usersByRole,
    presence: {
      hoursConfigured,
      isWorkDay,
      present,
      late,
      absent,
      expected,
      attendancePercent: attendancePercent(present, late, expected),
      rowCount: (presenceRows ?? []).length,
    },
    projects: summarizeProjects(projects, date),
    tasksByStatus,
    taskTotal: taskTotal(tasksByStatus),
    employeeCount,
    summariesToday: new Set((summaryRows ?? []).map((row) => row.user_id)).size,
    approvedTasks: tasksByStatus.approved,
    internLogTotal: (internLogRows ?? []).length,
    internLogsToday,
    internCount,
  };
}

export async function getManagerDashboard(): Promise<ManagerDashboard> {
  await requireManager();
  const [{ date }, projects] = await Promise.all([
    currentWorkDate(),
    listProjects(),
  ]);
  const tasksByStatus = mergeTaskStatusCounts(projects);
  return {
    workDate: date,
    projects,
    projectCounts: summarizeProjects(projects, date),
    tasksByStatus,
    taskTotal: taskTotal(tasksByStatus),
  };
}

export async function getHeadDashboard(): Promise<HeadDashboard> {
  await requireProjectHead();
  const supabase = await createClient();
  const [{ date }, projects, internLogs] = await Promise.all([
    currentWorkDate(),
    listProjects(),
    listRelevantInternLogs(),
  ]);

  const tasksByStatus = mergeTaskStatusCounts(projects);
  const projectIds = projects.map((project) => project.id);
  let employeeTaskTotal = 0;
  let internTaskTotal = 0;
  let employeeApproved = 0;
  let internApproved = 0;

  if (projectIds.length > 0) {
    const { data: taskRows } = await supabase
      .from("tasks")
      .select("assignee_id, status")
      .in("project_id", projectIds);
    const assigneeIds = [
      ...new Set((taskRows ?? []).map((row) => row.assignee_id)),
    ];
    const roles = new Map<string, string>();
    if (assigneeIds.length > 0) {
      const { data: people } = await supabase
        .from("profiles")
        .select("id, role")
        .in("id", assigneeIds);
      for (const person of people ?? []) {
        roles.set(person.id, person.role);
      }
    }
    for (const row of taskRows ?? []) {
      const role = roles.get(row.assignee_id);
      if (role === "employee") {
        employeeTaskTotal += 1;
        if (row.status === "approved") {
          employeeApproved += 1;
        }
      } else if (role === "intern") {
        internTaskTotal += 1;
        if (row.status === "approved") {
          internApproved += 1;
        }
      }
    }
  }

  return {
    workDate: date,
    projects,
    projectCounts: summarizeProjects(projects, date),
    tasksByStatus,
    taskTotal: taskTotal(tasksByStatus),
    pendingReviews: tasksByStatus.submitted + tasksByStatus.resubmitted,
    approved: tasksByStatus.approved,
    rejected: tasksByStatus.rejected,
    employeeTaskTotal,
    internTaskTotal,
    employeeApproved,
    internApproved,
    internLogs,
  };
}

function presenceStatus(
  status: string | undefined,
): "present" | "late" | null {
  if (status === "present" || status === "late") {
    return status;
  }
  return null;
}

export async function getEmployeeDashboard(): Promise<WorkerDashboard> {
  const profile = await requireEmployee();
  const { date } = await currentWorkDate();
  const [presence, tasks, feedback, summary] = await Promise.all([
    getMyPresenceToday(),
    listAssignedTasks(profile.id),
    listFeedbackForAssignee(profile.id),
    getTodayEmployeeSummary(profile.id, date),
  ]);

  return {
    workDate: date,
    presence: {
      hoursConfigured: presence.configured,
      status: presenceStatus(presence.record?.status),
    },
    tasks,
    tasksByStatus: countsFromTasks(tasks),
    feedback,
    dailyWriteSubmitted: Boolean(summary),
  };
}

export async function getInternDashboard(): Promise<WorkerDashboard> {
  const profile = await requireIntern();
  const { date } = await currentWorkDate();
  const [presence, tasks, feedback, log] = await Promise.all([
    getMyPresenceToday(),
    listAssignedTasks(profile.id),
    listFeedbackForAssignee(profile.id),
    getTodayInternLog(profile.id, date),
  ]);

  return {
    workDate: date,
    presence: {
      hoursConfigured: presence.configured,
      status: presenceStatus(presence.record?.status),
    },
    tasks,
    tasksByStatus: countsFromTasks(tasks),
    feedback,
    dailyWriteSubmitted: Boolean(log),
  };
}
