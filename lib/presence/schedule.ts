import { createClient } from "@/lib/supabase/server";
import { asTime } from "@/lib/presence/schedule-input";
import type { WorkSchedule } from "@/lib/presence/types";
import { cache } from "react";

export const getWorkSchedule = cache(async (): Promise<WorkSchedule | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("work_schedules")
    .select(
      "id, monday, tuesday, wednesday, thursday, friday, saturday, sunday, work_start, work_end, late_threshold_minutes, break_start, break_end, timezone",
    )
    .eq("id", 1)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return {
    id: 1,
    monday: data.monday,
    tuesday: data.tuesday,
    wednesday: data.wednesday,
    thursday: data.thursday,
    friday: data.friday,
    saturday: data.saturday,
    sunday: data.sunday,
    work_start: asTime(data.work_start) ?? "00:00:00",
    work_end: asTime(data.work_end) ?? "00:00:00",
    late_threshold_minutes: data.late_threshold_minutes,
    break_start: asTime(data.break_start),
    break_end: asTime(data.break_end),
    timezone: data.timezone,
  };
});
