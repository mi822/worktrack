import { cache } from "react";
import { calendarDateInZone, isWorkingDay } from "@/lib/logs/work-date";
import {
  computePerformance,
  DEFAULT_PERFORMANCE_WEIGHTS,
  type PerformanceInputs,
  type PerformanceWeights,
} from "@/lib/performance/score";
import type {
  PerformanceReport,
  PerformanceReviewRow,
  PerformanceSubject,
} from "@/lib/performance/types";
import { getWorkSchedule } from "@/lib/presence/schedule";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";
import { eachYmd, rollingPeriod } from "@/lib/ymd";
import { listProjects, listTasksForProjects } from "@/lib/work/queries";

function isWorkerRole(
  role: string,
): role is PerformanceSubject["role"] {
  return role === "employee" || role === "intern";
}

function asWeights(row: {
  w_completion: number | string;
  w_ontime: number | string;
  w_attendance: number | string;
  w_quality: number | string;
  w_participation: number | string;
}): PerformanceWeights {
  return {
    w_completion: Number(row.w_completion),
    w_ontime: Number(row.w_ontime),
    w_attendance: Number(row.w_attendance),
    w_quality: Number(row.w_quality),
    w_participation: Number(row.w_participation),
  };
}

export const getPerformanceWeights = cache(async (): Promise<PerformanceWeights> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("performance_settings")
    .select(
      "w_completion, w_ontime, w_attendance, w_quality, w_participation",
    )
    .eq("id", 1)
    .maybeSingle();
  if (!data) {
    return DEFAULT_PERFORMANCE_WEIGHTS;
  }
  return asWeights(data);
});

function canAccessPerformance(viewer: Profile): boolean {
  return (
    viewer.role === "admin" ||
    viewer.role === "manager" ||
    viewer.role === "project_head"
  );
}

export function hasPerformanceActivity(inputs: PerformanceInputs): boolean {
  return (
    inputs.assigned > 0 ||
    inputs.scannedDays > 0 ||
    inputs.participationDays > 0
  );
}

export async function listPerformanceSubjects(
  viewer: Profile,
): Promise<PerformanceSubject[]> {
  if (!canAccessPerformance(viewer)) {
    return [];
  }

  const supabase = await createClient();
  if (viewer.role === "admin") {
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, role")
      .in("role", ["employee", "intern"])
      .eq("is_active", true)
      .order("full_name");
    return (data ?? []).flatMap((row) =>
      isWorkerRole(row.role)
        ? [{ id: row.id, full_name: row.full_name, role: row.role }]
        : [],
    );
  }

  const projects = await listProjects();
  const tasks = await listTasksForProjects(projects.map((project) => project.id));
  const ids = [...new Set(tasks.map((task) => task.assignee_id))];
  if (ids.length === 0) {
    return [];
  }
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .in("id", ids)
    .eq("is_active", true)
    .order("full_name");
  return (data ?? []).flatMap((row) =>
    isWorkerRole(row.role)
      ? [{ id: row.id, full_name: row.full_name, role: row.role }]
      : [],
  );
}

export async function canViewPerformance(
  viewer: Profile,
  subjectId: string,
): Promise<boolean> {
  if (!canAccessPerformance(viewer)) {
    return false;
  }
  const subjects = await listPerformanceSubjects(viewer);
  return subjects.some((subject) => subject.id === subjectId);
}

async function loadSubject(
  subjectId: string,
): Promise<PerformanceSubject | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .eq("id", subjectId)
    .maybeSingle();
  if (!data || !isWorkerRole(data.role)) {
    return null;
  }
  return { id: data.id, full_name: data.full_name, role: data.role };
}

type TaskInputRow = {
  id: number;
  assignee_id: string;
  status: string;
  deadline: string;
};

type SubmissionInputRow = {
  task_id: number;
  created_at: string;
};

function emptyInputs(expectedDays: number): PerformanceInputs {
  return {
    assigned: 0,
    approved: 0,
    onTimeApproved: 0,
    rejected: 0,
    scannedDays: 0,
    expectedDays,
    participationDays: 0,
  };
}

function onTimeApprovedCount(
  tasks: TaskInputRow[],
  submissions: SubmissionInputRow[],
  timezone: string,
): number {
  const lastByTask = new Map<number, string>();
  for (const row of submissions) {
    const day = calendarDateInZone(timezone, new Date(row.created_at));
    const previous = lastByTask.get(row.task_id);
    if (!previous || day > previous) {
      lastByTask.set(row.task_id, day);
    }
  }
  let onTimeApproved = 0;
  for (const task of tasks) {
    if (task.status !== "approved") {
      continue;
    }
    const last = lastByTask.get(task.id);
    if (last && last <= task.deadline) {
      onTimeApproved += 1;
    }
  }
  return onTimeApproved;
}

function inputsFromRows(
  tasks: TaskInputRow[],
  submissions: SubmissionInputRow[],
  scannedDates: string[],
  logDates: string[],
  expectedDays: number,
  timezone: string,
): PerformanceInputs {
  const assigned = tasks.length;
  const approved = tasks.filter((task) => task.status === "approved").length;
  const rejected = tasks.filter((task) => task.status === "rejected").length;
  return {
    assigned,
    approved,
    onTimeApproved: onTimeApprovedCount(tasks, submissions, timezone),
    rejected,
    scannedDays: new Set(scannedDates).size,
    expectedDays,
    participationDays: new Set(logDates).size,
  };
}

async function expectedWorkingDays(
  periodStart: string,
  periodEnd: string,
): Promise<{ expectedDays: number; timezone: string }> {
  const schedule = await getWorkSchedule();
  const timezone = schedule?.timezone ?? "Africa/Douala";
  const expectedDays = schedule
    ? eachYmd(periodStart, periodEnd).filter((date) =>
        isWorkingDay(schedule, date),
      ).length
    : 0;
  return { expectedDays, timezone };
}

async function collectInputs(
  subject: PerformanceSubject,
  periodStart: string,
  periodEnd: string,
): Promise<PerformanceInputs> {
  const map = await collectInputsForSubjects([subject], periodStart, periodEnd);
  return map.get(subject.id) ?? emptyInputs(0);
}

async function collectInputsForSubjects(
  subjects: PerformanceSubject[],
  periodStart: string,
  periodEnd: string,
): Promise<Map<string, PerformanceInputs>> {
  const result = new Map<string, PerformanceInputs>();
  const { expectedDays, timezone } = await expectedWorkingDays(
    periodStart,
    periodEnd,
  );
  if (subjects.length === 0) {
    return result;
  }

  const ids = subjects.map((subject) => subject.id);
  const internIds = subjects
    .filter((subject) => subject.role === "intern")
    .map((subject) => subject.id);
  const employeeIds = subjects
    .filter((subject) => subject.role === "employee")
    .map((subject) => subject.id);

  const supabase = await createClient();
  const [taskResult, presenceResult, internResult, employeeResult] =
    await Promise.all([
      supabase
        .from("tasks")
        .select("id, assignee_id, status, deadline")
        .in("assignee_id", ids),
      supabase
        .from("presence")
        .select("user_id, work_date")
        .in("user_id", ids)
        .gte("work_date", periodStart)
        .lte("work_date", periodEnd),
      internIds.length > 0
        ? supabase
            .from("intern_learning_logs")
            .select("user_id, work_date")
            .in("user_id", internIds)
            .gte("work_date", periodStart)
            .lte("work_date", periodEnd)
        : Promise.resolve({ data: [] as { user_id: string; work_date: string }[] }),
      employeeIds.length > 0
        ? supabase
            .from("employee_daily_summaries")
            .select("user_id, work_date")
            .in("user_id", employeeIds)
            .gte("work_date", periodStart)
            .lte("work_date", periodEnd)
        : Promise.resolve({ data: [] as { user_id: string; work_date: string }[] }),
    ]);

  const tasks: TaskInputRow[] = (taskResult.data ?? []).map((row) => ({
    id: Number(row.id),
    assignee_id: row.assignee_id,
    status: row.status,
    deadline: row.deadline,
  }));
  const approvedIds = tasks
    .filter((task) => task.status === "approved")
    .map((task) => task.id);

  const { data: submissionRows } =
    approvedIds.length > 0
      ? await supabase
          .from("task_submissions")
          .select("task_id, created_at")
          .in("task_id", approvedIds)
      : { data: [] as { task_id: number | string; created_at: string }[] };

  const submissions: SubmissionInputRow[] = (submissionRows ?? []).map(
    (row) => ({
      task_id: Number(row.task_id),
      created_at: row.created_at,
    }),
  );

  const tasksByUser = new Map<string, TaskInputRow[]>();
  for (const task of tasks) {
    const list = tasksByUser.get(task.assignee_id) ?? [];
    list.push(task);
    tasksByUser.set(task.assignee_id, list);
  }
  const scannedByUser = new Map<string, string[]>();
  for (const row of presenceResult.data ?? []) {
    const list = scannedByUser.get(row.user_id) ?? [];
    list.push(row.work_date);
    scannedByUser.set(row.user_id, list);
  }
  const logsByUser = new Map<string, string[]>();
  for (const row of [...(internResult.data ?? []), ...(employeeResult.data ?? [])]) {
    const list = logsByUser.get(row.user_id) ?? [];
    list.push(row.work_date);
    logsByUser.set(row.user_id, list);
  }

  for (const subject of subjects) {
    const subjectTasks = tasksByUser.get(subject.id) ?? [];
    const subjectTaskIds = new Set(subjectTasks.map((task) => task.id));
    result.set(
      subject.id,
      inputsFromRows(
        subjectTasks,
        submissions.filter((row) => subjectTaskIds.has(row.task_id)),
        scannedByUser.get(subject.id) ?? [],
        logsByUser.get(subject.id) ?? [],
        expectedDays,
        timezone,
      ),
    );
  }
  return result;
}

export async function listReviewsForSubject(
  subjectId: string,
): Promise<PerformanceReviewRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("performance_reviews")
    .select(
      "id, subject_id, reviewer_id, period_start, period_end, rating, comments, created_at",
    )
    .eq("subject_id", subjectId)
    .order("created_at", { ascending: false });

  const reviewerIds = [...new Set((data ?? []).map((row) => row.reviewer_id))];
  const names = new Map<string, string>();
  if (reviewerIds.length > 0) {
    const { data: people } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", reviewerIds);
    for (const person of people ?? []) {
      names.set(person.id, person.full_name);
    }
  }

  return (data ?? []).map((row) => ({
    id: Number(row.id),
    subject_id: row.subject_id,
    reviewer_id: row.reviewer_id,
    reviewer_name: names.get(row.reviewer_id) ?? "Reviewer",
    period_start: row.period_start,
    period_end: row.period_end,
    rating: row.rating,
    comments: row.comments,
    created_at: row.created_at,
  }));
}

export async function getPerformanceSnapshot(
  subject: PerformanceSubject,
  periodEnd?: string,
): Promise<{ score: number; attendance: number } | null> {
  const schedule = await getWorkSchedule();
  const timezone = schedule?.timezone ?? "Africa/Douala";
  const end = periodEnd ?? calendarDateInZone(timezone);
  const { start } = rollingPeriod(end, 30);
  const [weights, inputs] = await Promise.all([
    getPerformanceWeights(),
    collectInputs(subject, start, end),
  ]);
  if (!hasPerformanceActivity(inputs)) {
    return null;
  }
  const breakdown = computePerformance(inputs, weights);
  return {
    score: Math.round(breakdown.score * 10) / 10,
    attendance: breakdown.attendance,
  };
}

export async function getPerformanceReport(
  subjectId: string,
  periodEnd?: string,
): Promise<PerformanceReport | null> {
  const subject = await loadSubject(subjectId);
  if (!subject) {
    return null;
  }
  const schedule = await getWorkSchedule();
  const timezone = schedule?.timezone ?? "Africa/Douala";
  const end = periodEnd ?? calendarDateInZone(timezone);
  const { start } = rollingPeriod(end, 30);
  const [weights, inputs, reviews] = await Promise.all([
    getPerformanceWeights(),
    collectInputs(subject, start, end),
    listReviewsForSubject(subjectId),
  ]);
  return {
    subject,
    periodStart: start,
    periodEnd: end,
    weights,
    breakdown: computePerformance(inputs, weights),
    ...inputs,
    reviews,
  };
}

export async function averageTeamScore(viewer: Profile): Promise<number | null> {
  if (!canAccessPerformance(viewer)) {
    return null;
  }
  const subjects = await listPerformanceSubjects(viewer);
  if (subjects.length === 0) {
    return null;
  }
  const schedule = await getWorkSchedule();
  const timezone = schedule?.timezone ?? "Africa/Douala";
  const end = calendarDateInZone(timezone);
  const { start } = rollingPeriod(end, 30);
  const [weights, inputMap] = await Promise.all([
    getPerformanceWeights(),
    collectInputsForSubjects(subjects, start, end),
  ]);
  const scores = subjects.flatMap((subject) => {
    const inputs = inputMap.get(subject.id) ?? emptyInputs(0);
    if (!hasPerformanceActivity(inputs)) {
      return [];
    }
    return [computePerformance(inputs, weights).score];
  });
  if (scores.length === 0) {
    return null;
  }
  const sum = scores.reduce((total, value) => total + value, 0);
  return Math.round((sum / scores.length) * 10) / 10;
}
