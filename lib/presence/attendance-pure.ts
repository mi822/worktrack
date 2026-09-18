import type { AppRole } from "@/lib/types";

export type AttendanceDayKind = "inactive" | "active" | "closed";

export function canActivateAttendance(role: AppRole) {
  return role === "admin";
}

export function canRecordAttendance(role: AppRole) {
  return (
    role === "intern" ||
    role === "employee" ||
    role === "project_head" ||
    role === "manager"
  );
}

export function presenceStatusFromClock(
  localMinutes: number,
  workStartMinutes: number,
  lateThresholdMinutes: number,
): "present" | "late" {
  return localMinutes <= workStartMinutes + lateThresholdMinutes
    ? "present"
    : "late";
}

export function attendanceDayKind(
  row: { closed_at: string | null } | null,
): AttendanceDayKind {
  if (!row) {
    return "inactive";
  }
  if (row.closed_at) {
    return "closed";
  }
  return "active";
}

export function attendanceAvailability(input: {
  hoursConfigured: boolean;
  isWorkDay: boolean;
  dayKind: AttendanceDayKind;
}): "hours_unset" | "not_work_day" | AttendanceDayKind {
  if (!input.hoursConfigured) {
    return "hours_unset";
  }
  if (!input.isWorkDay) {
    return "not_work_day";
  }
  return input.dayKind;
}
