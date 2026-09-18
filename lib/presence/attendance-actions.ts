"use server";

import { requireAdmin, requireProfile } from "@/lib/auth";
import {
  attendanceAvailability,
  attendanceDayKind,
  canRecordAttendance,
} from "@/lib/presence/attendance-pure";
import { getWorkSchedule } from "@/lib/presence/schedule";
import { workingDateInZone } from "@/lib/presence/schedule-input";
import type {
  AttendanceDayKind,
  AttendanceDayRecord,
  PresenceRow,
  PresenceStatus,
} from "@/lib/presence/types";
import { isWorkingDay } from "@/lib/logs/work-date";
import { isAppRole } from "@/lib/types";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function firstRpcRow<T>(data: T | T[] | null): T | null {
  if (!data) {
    return null;
  }
  return Array.isArray(data) ? (data[0] ?? null) : data;
}

export async function getAttendanceDay(
  workDate: string,
): Promise<AttendanceDayRecord | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("attendance_days")
    .select("work_date, activated_at, closed_at")
    .eq("work_date", workDate)
    .maybeSingle();
  if (!data) {
    return null;
  }
  return {
    work_date: data.work_date,
    activated_at: data.activated_at,
    closed_at: data.closed_at,
  };
}

export async function getMyAttendanceToday(): Promise<{
  workDate: string;
  configured: boolean;
  isWorkDay: boolean;
  dayKind: AttendanceDayKind;
  availability: ReturnType<typeof attendanceAvailability>;
  activatedAt: string | null;
  record: {
    status: PresenceStatus;
    scanned_at: string;
    work_date: string;
  } | null;
}> {
  const profile = await requireProfile();
  const schedule = await getWorkSchedule();
  if (!schedule || profile.role === "admin") {
    return {
      workDate: "",
      configured: Boolean(schedule),
      isWorkDay: false,
      dayKind: "inactive",
      availability: schedule ? "not_work_day" : "hours_unset",
      activatedAt: null,
      record: null,
    };
  }

  const workDate = workingDateInZone(schedule.timezone);
  const isWorkDay = isWorkingDay(schedule, workDate);
  const day = await getAttendanceDay(workDate);
  const dayKind = attendanceDayKind(day);
  const supabase = await createClient();
  const { data } = await supabase
    .from("presence")
    .select("status, scanned_at, work_date")
    .eq("user_id", profile.id)
    .eq("work_date", workDate)
    .maybeSingle();

  return {
    workDate,
    configured: true,
    isWorkDay,
    dayKind,
    availability: attendanceAvailability({
      hoursConfigured: true,
      isWorkDay,
      dayKind,
    }),
    activatedAt: day?.activated_at ?? null,
    record: data
      ? {
          status: data.status as PresenceStatus,
          scanned_at: data.scanned_at,
          work_date: data.work_date,
        }
      : null,
  };
}

export async function listMyPresenceHistory(): Promise<
  { work_date: string; scanned_at: string; status: PresenceStatus }[]
> {
  const profile = await requireProfile();
  if (!canRecordAttendance(profile.role)) {
    return [];
  }
  const supabase = await createClient();
  const { data } = await supabase
    .from("presence")
    .select("work_date, scanned_at, status")
    .eq("user_id", profile.id)
    .order("work_date", { ascending: false })
    .limit(60);

  return (data ?? []).flatMap((row) =>
    row.status === "present" || row.status === "late"
      ? [
          {
            work_date: row.work_date,
            scanned_at: row.scanned_at,
            status: row.status,
          },
        ]
      : [],
  );
}

export async function listPresenceRecords(): Promise<PresenceRow[]> {
  await requireAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("presence")
    .select("id, user_id, work_date, scanned_at, status, qr_code_id")
    .order("scanned_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  const userIds = [...new Set(data.map((row) => row.user_id))];
  const people = new Map<string, { full_name: string; role: string }>();
  if (userIds.length > 0) {
    const { data: rows } = await supabase
      .from("profiles")
      .select("id, full_name, role")
      .in("id", userIds);
    for (const person of rows ?? []) {
      people.set(person.id, {
        full_name: person.full_name,
        role: isAppRole(person.role) ? person.role : person.role,
      });
    }
  }

  return data.map((row) => {
    const person = people.get(row.user_id);
    return {
      id: row.id,
      user_id: row.user_id,
      work_date: row.work_date,
      scanned_at: row.scanned_at,
      status: row.status as PresenceStatus,
      qr_code_id: row.qr_code_id,
      full_name: person?.full_name ?? "Unknown",
      role: person?.role ?? "",
    };
  });
}

export async function recordTodaysPresence() {
  const profile = await requireProfile();
  if (!canRecordAttendance(profile.role)) {
    redirect(`/?presence=admin_cannot_scan`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("record_presence");
  if (error) {
    redirect("/?presence=record_failed");
  }

  const row = firstRpcRow(data) as { ok?: boolean; code?: string } | null;
  const code = row?.code ?? "record_failed";
  revalidatePath("/");
  revalidatePath("/attendance");
  revalidatePath("/admin/attendance");
  revalidatePath("/timesheet");
  redirect(`/?presence=${encodeURIComponent(code)}`);
}

export async function activateTodaysAttendance() {
  await requireAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("activate_todays_attendance");
  if (error) {
    redirect("/?attendance=error");
  }
  const row = firstRpcRow(data) as { ok?: boolean; code?: string } | null;
  const code = row?.ok ? (row.code ?? "activated") : (row?.code ?? "error");
  revalidatePath("/");
  revalidatePath("/admin/attendance");
  redirect(`/?attendance=${encodeURIComponent(code)}`);
}

export async function closeTodaysAttendance() {
  await requireAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("close_todays_attendance");
  if (error) {
    redirect("/?attendance=error");
  }
  const row = firstRpcRow(data) as { ok?: boolean; code?: string } | null;
  const code = row?.ok ? (row.code ?? "closed") : (row?.code ?? "error");
  revalidatePath("/");
  revalidatePath("/admin/attendance");
  redirect(`/?attendance=${encodeURIComponent(code)}`);
}
