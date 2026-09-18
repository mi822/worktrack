import { cache } from "react";
import { getCurrentProfile } from "@/lib/auth";
import {
  getTodayEmployeeSummary,
  getTodayInternLog,
} from "@/lib/logs/queries";
import { calendarDateInZone, isWorkingDay } from "@/lib/logs/work-date";
import {
  deadlineWindow,
  reminderActivityHref,
  reminderProjectHref,
  reminderTaskHref,
} from "@/lib/notifications/reminders-pure";
import { clockMinutesInZone, timeToMinutes } from "@/lib/clock";
import { getWorkSchedule } from "@/lib/presence/schedule";
import { createClient } from "@/lib/supabase/server";
import { listAssignedTasks } from "@/lib/work/queries";

async function notifyOnce(input: {
  recipientId: string;
  kind: "deadline_task" | "deadline_project" | "reminder_activity";
  title: string;
  body: string;
  href: string;
}) {
  try {
    const supabase = await createClient();
    await supabase.rpc("notify_user_once", {
      p_recipient_id: input.recipientId,
      p_kind: input.kind,
      p_title: input.title,
      p_body: input.body,
      p_href: input.href,
    });
  } catch {
    // Reminders must never block the page.
  }
}

async function listOpenProjectDeadlines(): Promise<
  { id: number; title: string; deadline: string }[]
> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("id, title, deadline, status")
    .neq("status", "closed");

  if (error || !data) {
    return [];
  }

  return data.map((row) => ({
    id: Number(row.id),
    title: row.title,
    deadline: row.deadline,
  }));
}

export const ensureReminderNotifications = cache(async (): Promise<void> => {
  const profile = await getCurrentProfile();
  if (!profile) {
    return;
  }

  const schedule = await getWorkSchedule();
  const timezone = schedule?.timezone ?? "Africa/Douala";
  const today = calendarDateInZone(timezone);
  const { end } = deadlineWindow(today, 2);
  const pending: Promise<void>[] = [];

  if (profile.role === "employee" || profile.role === "intern") {
    const tasks = await listAssignedTasks(profile.id);
    for (const task of tasks) {
      if (task.status === "approved") {
        continue;
      }
      if (task.deadline < today || task.deadline > end) {
        continue;
      }
      pending.push(
        notifyOnce({
          recipientId: profile.id,
          kind: "deadline_task",
          title: "Task deadline approaching",
          body: `${task.description} is due ${task.deadline}.`,
          href: reminderTaskHref(task.id),
        }),
      );
    }
  }

  if (profile.role === "manager" || profile.role === "project_head") {
    const projects = await listOpenProjectDeadlines();
    for (const project of projects) {
      if (project.deadline < today || project.deadline > end) {
        continue;
      }
      pending.push(
        notifyOnce({
          recipientId: profile.id,
          kind: "deadline_project",
          title: "Project deadline approaching",
          body: `${project.title} is due ${project.deadline}.`,
          href: reminderProjectHref(project.id),
        }),
      );
    }
  }

  if (
    schedule &&
    isWorkingDay(schedule, today) &&
    (profile.role === "employee" || profile.role === "intern")
  ) {
    const nowMinutes = clockMinutesInZone(new Date().toISOString(), timezone);
    const endMinutes = timeToMinutes(schedule.work_end);
    if (nowMinutes !== null && endMinutes !== null && nowMinutes > endMinutes) {
      const submitted =
        profile.role === "employee"
          ? Boolean(await getTodayEmployeeSummary(profile.id, today))
          : Boolean(await getTodayInternLog(profile.id, today));
      if (!submitted) {
        pending.push(
          notifyOnce({
            recipientId: profile.id,
            kind: "reminder_activity",
            title:
              profile.role === "employee"
                ? "End-of-day summary missing"
                : "Learning log missing",
            body: "Today’s expected write is still empty.",
            href: reminderActivityHref(profile.role),
          }),
        );
      }
    }
  }

  if (pending.length === 0) {
    return;
  }
  await Promise.all(pending);
});
