import { WEEKDAYS } from "@/lib/presence/types";

export function asTime(value: string | null | undefined) {
  if (!value) {
    return null;
  }
  return value.length >= 5 ? value.slice(0, 8) : value;
}

export function toInputTime(value: string | null) {
  if (!value) {
    return "";
  }
  return value.slice(0, 5);
}

export function workingDateInZone(timezone: string, at = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(at);
}

export function validateScheduleInput(formData: FormData) {
  const days = Object.fromEntries(
    WEEKDAYS.map((day) => [day, formData.get(day) === "on"]),
  ) as Record<(typeof WEEKDAYS)[number], boolean>;
  const workStart = String(formData.get("work_start") ?? "").trim();
  const workEnd = String(formData.get("work_end") ?? "").trim();
  const timezone = String(formData.get("timezone") ?? "").trim();
  const graceRaw = String(formData.get("late_threshold_minutes") ?? "").trim();
  const breakStart = String(formData.get("break_start") ?? "").trim();
  const breakEnd = String(formData.get("break_end") ?? "").trim();
  const grace = Number.parseInt(graceRaw, 10);

  if (!WEEKDAYS.some((day) => days[day])) {
    return { error: "Select at least one working day." };
  }
  if (!workStart || !workEnd || !timezone) {
    return { error: "Start time, end time, and timezone are required." };
  }
  if (!Number.isFinite(grace) || grace < 0) {
    return { error: "Late threshold cannot be negative." };
  }
  if (workEnd <= workStart) {
    return { error: "End time must be after start time." };
  }
  if ((breakStart && !breakEnd) || (!breakStart && breakEnd)) {
    return { error: "Break start and end must both be set, or both left empty." };
  }
  if (breakStart && breakEnd && breakEnd <= breakStart) {
    return { error: "Break end must be after break start." };
  }

  return {
    error: null,
    schedule: {
      id: 1 as const,
      ...days,
      work_start: workStart,
      work_end: workEnd,
      late_threshold_minutes: grace,
      break_start: breakStart || null,
      break_end: breakEnd || null,
      timezone,
    },
  };
}
