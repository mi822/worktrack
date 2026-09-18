import {
  attendancePercent,
  attentionTasks,
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
import {
  calendarDateInZone,
  currentWorkDate,
  FALLBACK_WORK_TIMEZONE,
} from "@/lib/logs/work-date";
import { getMyPresenceToday } from "@/lib/presence/presence-actions";
import { getWorkSchedule } from "@/lib/presence/schedule";
import {
  requireAdmin,
  requireEmployee,
  requireIntern,
  requireManager,
  requireProjectHead,
} from "@/lib/auth";
import { fillWeek, lastSevenDates } from "@/lib/dashboards/week";
import { APP_ROLES, isAppRole } from "@/lib/types";
import { createClient } from "@/lib/supabase/server";
import {
  listAssignedTasks,
  listFeedbackForAssignee,
  listProjects,
  listTasksForProjects,
} from "@/lib/work/queries";
import {
  emptyTaskStatusCounts,
  isTaskStatus,
  type TaskStatus,
} from "@/lib/work/types";
import { averageTeamScore, getPerformanceSnapshot } from "@/lib/performance/queries";
import { getEngagementOverview } from "@/lib/surveys/queries";
import { getTimesheetRange } from "@/lib/timesheet/queries";

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
  const profile = await requireAdmin();
  const supabase = await createClient();
  const schedule = await getWorkSchedule();
  const date = calendarDateInZone(schedule?.timezone || FALLBACK_WORK_TIMEZONE);

  const weekStart = lastSevenDates(date)[0] ?? date;
  const [
    projects,
    { data: profiles },
    { data: presenceRows },
    { data: summaryRows },
    { data: internLogRows },
    { data: weekRows },
  ] = await Promise.all([
    listProjects(),
    supabase.from("profiles").select("id, role, is_active"),
    supabase.from("presence").select("user_id, status").eq("work_date", date),
    supabase
      .from("employee_daily_summaries")
      .select("user_id")
      .eq("work_date", date),
    supabase.from("intern_learning_logs").select("id, work_date"),
    supabase
      .from("presence")
      .select("work_date, status")
      .gte("work_date", weekStart)
      .lte("work_date", date),
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

  const [avgPerformance, engagement] = await Promise.all([
    averageTeamScore(profile),
    getEngagementOverview(),
  ]);

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
    week: fillWeek(date, weekRows ?? []),
    avgPerformance,
    engagementAvgRating: engagement.avgRating,
    surveyResponseRate: engagement.responseRate,
  };
}

export async function getManagerDashboard(): Promise<ManagerDashboard> {
  const profile = await requireManager();
  const [{ date }, projects] = await Promise.all([
    currentWorkDate(),
    listProjects(),
  ]);
  const tasksByStatus = mergeTaskStatusCounts(projects);
  const projectTasks = await listTasksForProjects(projects.map((project) => project.id));
  const [team, teamAvgPerformance] = await Promise.all([
    teamPresenceForTasks(
      date,
      projectTasks.map((task) => task.assignee_id),
    ),
    averageTeamScore(profile),
  ]);
  return {
    workDate: date,
    projects,
    projectCounts: summarizeProjects(projects, date),
    tasksByStatus,
    taskTotal: taskTotal(tasksByStatus),
    attention: attentionTasks(projectTasks, date),
    teamPresent: team.present,
    teamLate: team.late,
    teamAbsent: team.absent,
    teamAvgPerformance,
  };
}

export async function getHeadDashboard(): Promise<HeadDashboard> {
  const profile = await requireProjectHead();
  const supabase = await createClient();
  const [{ date }, projects, internLogs] = await Promise.all([
    currentWorkDate(),
    listProjects(),
    listRelevantInternLogs(),
  ]);

  const tasksByStatus = mergeTaskStatusCounts(projects);
  const projectIds = projects.map((project) => project.id);
  const projectTasks = await listTasksForProjects(projectIds);
  let employeeTaskTotal = 0;
  let internTaskTotal = 0;
  let employeeApproved = 0;
  let internApproved = 0;

  const assigneeIds = [...new Set(projectTasks.map((task) => task.assignee_id))];
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
  for (const row of projectTasks) {
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

  const [team, teamAvgPerformance, engagement] = await Promise.all([
    teamPresenceForTasks(date, assigneeIds),
    averageTeamScore(profile),
    getEngagementOverview(),
  ]);

  return {
    workDate: date,
    projects,
    projectCounts: summarizeProjects(projects, date),
    tasksByStatus,
    taskTotal: taskTotal(tasksByStatus),
    pendingReviews: tasksByStatus.submitted + tasksByStatus.under_review,
    overdueTasks: projectTasks.filter(
      (task) => task.deadline < date && task.status !== "approved",
    ).length,
    approved: tasksByStatus.approved,
    rejected: tasksByStatus.rejected,
    employeeTaskTotal,
    internTaskTotal,
    employeeApproved,
    internApproved,
    internLogs,
    attention: attentionTasks(projectTasks, date),
    teamPresent: team.present,
    teamLate: team.late,
    teamAbsent: team.absent,
    teamAvgPerformance,
    engagementAvgRating: engagement.avgRating,
    surveyResponseRate: engagement.responseRate,
  };
}

async function teamPresenceForTasks(
  workDate: string,
  assigneeIds: string[],
): Promise<{ present: number; late: number; absent: number }> {
  const unique = [...new Set(assigneeIds)];
  if (unique.length === 0) {
    return { present: 0, late: 0, absent: 0 };
  }
  const supabase = await createClient();
  const { data } = await supabase
    .from("presence")
    .select("user_id, status")
    .eq("work_date", workDate)
    .in("user_id", unique);
  let present = 0;
  let late = 0;
  const seen = new Set<string>();
  for (const row of data ?? []) {
    seen.add(row.user_id);
    if (row.status === "present") {
      present += 1;
    } else if (row.status === "late") {
      late += 1;
    }
  }
  return {
    present,
    late,
    absent: Math.max(0, unique.length - seen.size),
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
  const supabase = await createClient();
  const [workDate, presence, tasks, feedback] = await Promise.all([
    currentWorkDate(),
    getMyPresenceToday(),
    listAssignedTasks(profile.id),
    listFeedbackForAssignee(profile.id),
  ]);
  const date = workDate.date;
  const weekStart = lastSevenDates(date)[0] ?? date;
  const [summary, weekPresence, snapshot, todayHours] = await Promise.all([
    getTodayEmployeeSummary(profile.id, date),
    supabase
      .from("presence")
      .select("work_date, status")
      .eq("user_id", profile.id)
      .gte("work_date", weekStart)
      .lte("work_date", date),
    getPerformanceSnapshot({
      id: profile.id,
      full_name: profile.full_name,
      role: "employee",
    }),
    getTimesheetRange(profile.id, date, date),
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
    week: fillWeek(date, weekPresence.data ?? []),
    attendancePercent: snapshot
      ? Math.round(snapshot.attendance * 1000) / 10
      : null,
    hoursToday: todayHours[0]?.actualHours ?? null,
  };
}

export async function getInternDashboard(): Promise<WorkerDashboard> {
  const profile = await requireIntern();
  const supabase = await createClient();
  const [workDate, presence, tasks, feedback] = await Promise.all([
    currentWorkDate(),
    getMyPresenceToday(),
    listAssignedTasks(profile.id),
    listFeedbackForAssignee(profile.id),
  ]);
  const date = workDate.date;
  const weekStart = lastSevenDates(date)[0] ?? date;
  const [log, weekPresence, snapshot, todayHours] = await Promise.all([
    getTodayInternLog(profile.id, date),
    supabase
      .from("presence")
      .select("work_date, status")
      .eq("user_id", profile.id)
      .gte("work_date", weekStart)
      .lte("work_date", date),
    getPerformanceSnapshot({
      id: profile.id,
      full_name: profile.full_name,
      role: "intern",
    }),
    getTimesheetRange(profile.id, date, date),
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
    week: fillWeek(date, weekPresence.data ?? []),
    attendancePercent: snapshot
      ? Math.round(snapshot.attendance * 1000) / 10
      : null,
    hoursToday: todayHours[0]?.actualHours ?? null,
  };
}
