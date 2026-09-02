import { getWorkSchedule } from "@/lib/presence/schedule";
import { WEEKDAYS, type Weekday, type WorkSchedule } from "@/lib/presence/types";

/** Used when working hours (and timezone) are not configured. Matches presence UI. */
export const FALLBACK_WORK_TIMEZONE = "Africa/Douala";

export function calendarDateInZone(timezone: string, at = new Date()): string {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
      .formatToParts(at)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );

  return `${parts.year}-${parts.month}-${parts.day}`;
}

export async function currentWorkDate(): Promise<{
  date: string;
  timezone: string;
}> {
  const schedule = await getWorkSchedule();
  const timezone = schedule?.timezone || FALLBACK_WORK_TIMEZONE;
  return { date: calendarDateInZone(timezone), timezone };
}

export function weekdayKey(dateYmd: string, timezone: string): Weekday | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateYmd);
  if (!match) {
    return null;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const utcNoon = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  const name = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    weekday: "long",
  })
    .format(utcNoon)
    .toLowerCase();
  return (WEEKDAYS as readonly string[]).includes(name)
    ? (name as Weekday)
    : null;
}

export function isWorkingDay(
  schedule: WorkSchedule,
  dateYmd: string,
): boolean {
  const key = weekdayKey(dateYmd, schedule.timezone);
  return key ? schedule[key] === true : false;
}
