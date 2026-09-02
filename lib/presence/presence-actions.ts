"use server";

import { requireAdmin, requireProfile } from "@/lib/auth";
import { messageForPresenceCode } from "@/lib/presence/messages";
import { tokenFromScanPayload } from "@/lib/presence/scan-payload";
import { getWorkSchedule } from "@/lib/presence/schedule";
import { workingDateInZone } from "@/lib/presence/schedule-input";
import type { PresenceRow } from "@/lib/presence/types";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

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
  const names = new Map<string, string>();
  if (userIds.length > 0) {
    const { data: people } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", userIds);
    for (const person of people ?? []) {
      names.set(person.id, person.full_name);
    }
  }

  return data.map((row) => ({
    id: row.id,
    user_id: row.user_id,
    work_date: row.work_date,
    scanned_at: row.scanned_at,
    status: row.status,
    qr_code_id: row.qr_code_id,
    full_name: names.get(row.user_id) ?? "Unknown",
  }));
}

export async function getMyPresenceToday() {
  const profile = await requireProfile();
  if (profile.role === "admin") {
    return { schedule: null, record: null, configured: false as const };
  }

  const schedule = await getWorkSchedule();
  if (!schedule) {
    return { schedule: null, record: null, configured: false as const };
  }

  const workDate = workingDateInZone(schedule.timezone);
  const supabase = await createClient();
  const { data } = await supabase
    .from("presence")
    .select("id, status, scanned_at, work_date")
    .eq("user_id", profile.id)
    .eq("work_date", workDate)
    .maybeSingle();

  return {
    schedule,
    configured: true as const,
    record: data,
  };
}

export async function recordPresenceScan(token: string) {
  const profile = await requireProfile();
  if (profile.role === "admin") {
    return { error: messageForPresenceCode("admin_cannot_scan"), recorded: false };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("record_presence", {
    p_token: tokenFromScanPayload(token),
  });

  if (error) {
    return { error: "Unable to record presence.", recorded: false };
  }

  const row = Array.isArray(data) ? data[0] : data;
  const code = row?.code as string | undefined;
  if (row?.ok) {
    revalidatePath("/scan");
    revalidatePath("/");
    revalidatePath("/admin/attendance");
    return { error: null, recorded: true, status: row.status as string };
  }

  return {
    error: messageForPresenceCode(code ?? null),
    recorded: false,
    alreadyRecorded: code === "already_recorded",
  };
}
