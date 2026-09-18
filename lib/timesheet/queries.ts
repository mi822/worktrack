import { clockMinutesInZone } from "@/lib/clock";
import { isWorkingDay } from "@/lib/logs/work-date";
import {
  computeTimesheetDay,
  sumHours,
  type TimesheetDayHours,
} from "@/lib/timesheet/hours";
import { getWorkSchedule } from "@/lib/presence/schedule";
import type { WorkSchedule } from "@/lib/presence/types";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";
import { addDaysYmd, eachYmd } from "@/lib/ymd";
import { listPerformanceSubjects } from "@/lib/performance/queries";

export type TimesheetDayRow = TimesheetDayHours & {
  workDate: string;
  isWorkingDay: boolean;
  scannedAt: string | null;
};

export type TimesheetPerson = {
  id: string;
  full_name: string;
  days: TimesheetDayRow[];
  totals: { actualHours: number; expectedHours: number };
};

function buildDay(
  schedule: WorkSchedule,
  workDate: string,
  scannedAt: string | null,
  status: "present" | "late" | null,
): TimesheetDayRow {
  const working = isWorkingDay(schedule, workDate);
  if (!working) {
    return {
      workDate,
      isWorkingDay: false,
      scannedAt,
      expectedHours: 0,
      actualHours: 0,
      lateMinutes: 0,
      earlyDeparture: null,
      overtime: null,
      status: "absent",
    };
  }
  const hours = computeTimesheetDay({
    workStart: schedule.work_start,
    workEnd: schedule.work_end,
    breakStart: schedule.break_start,
    breakEnd: schedule.break_end,
    scannedMinutes:
      scannedAt === null
        ? null
        : clockMinutesInZone(scannedAt, schedule.timezone),
    presenceStatus: status,
    lateThresholdMinutes: schedule.late_threshold_minutes,
  });
  return { workDate, isWorkingDay: true, scannedAt, ...hours };
}

export async function getTimesheetRange(
  userId: string,
  start: string,
  end: string,
): Promise<TimesheetDayRow[]> {
  const schedule = await getWorkSchedule();
  if (!schedule) {
    return [];
  }
  const supabase = await createClient();
  const { data } = await supabase
    .from("presence")
    .select("work_date, scanned_at, status")
    .eq("user_id", userId)
    .gte("work_date", start)
    .lte("work_date", end);

  const byDate = new Map(
    (data ?? []).map((row) => [
      row.work_date,
      {
        scanned_at: row.scanned_at as string,
        status: row.status as "present" | "late",
      },
    ]),
  );

  return eachYmd(start, end).map((date) => {
    const row = byDate.get(date);
    return buildDay(
      schedule,
      date,
      row?.scanned_at ?? null,
      row?.status ?? null,
    );
  });
}

export async function getMyTimesheet(
  profile: Profile,
  start: string,
  end: string,
): Promise<TimesheetPerson> {
  const days = await getTimesheetRange(profile.id, start, end);
  return {
    id: profile.id,
    full_name: profile.full_name,
    days,
    totals: sumHours(days.filter((day) => day.isWorkingDay)),
  };
}

export async function getTeamTimesheets(
  viewer: Profile,
  start: string,
  end: string,
): Promise<TimesheetPerson[]> {
  const subjects = await listPerformanceSubjects(viewer);
  const people =
    viewer.role === "admin" ||
    viewer.role === "manager" ||
    viewer.role === "project_head"
      ? subjects
      : subjects.filter((subject) => subject.id === viewer.id);

  const rows = await Promise.all(
    people.map(async (person) => {
      const days = await getTimesheetRange(person.id, start, end);
      return {
        id: person.id,
        full_name: person.full_name,
        days,
        totals: sumHours(days.filter((day) => day.isWorkingDay)),
      };
    }),
  );
  return rows;
}

export function defaultTimesheetRange(
  today: string,
  view: "week" | "month",
): { start: string; end: string } {
  if (view === "month") {
    return { start: `${today.slice(0, 8)}01`, end: today };
  }
  return { start: addDaysYmd(today, -6), end: today };
}
