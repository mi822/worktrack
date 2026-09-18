"use server";

import { requireProfile, requireScanner } from "@/lib/auth";
import { messageForPresenceCode } from "@/lib/presence/messages";
import { isLiveQr } from "@/lib/presence/qr-live";
import { tokenFromScanPayload } from "@/lib/presence/scan-payload";
import { getWorkSchedule } from "@/lib/presence/schedule";
import { workingDateInZone } from "@/lib/presence/schedule-input";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const NO_ACTIVE_QR =
  "Today's presence QR code has not been generated yet. Please contact the administrator.";


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
    return {
      error: messageForPresenceCode("admin_cannot_scan"),
      recorded: false as const,
      alreadyRecorded: false as const,
      fullName: profile.full_name,
    };
  }

  const schedule = await getWorkSchedule();
  const workDate = schedule
    ? workingDateInZone(schedule.timezone)
    : null;

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("record_presence", {
    p_token: tokenFromScanPayload(token),
  });

  if (error) {
    return {
      error: "Unable to record presence.",
      recorded: false as const,
      alreadyRecorded: false as const,
      fullName: profile.full_name,
    };
  }

  const row = Array.isArray(data) ? data[0] : data;
  const code = row?.code as string | undefined;
  const scannedAt = new Date().toISOString();

  if (row?.ok) {
    revalidatePath("/scan");
    revalidatePath("/");
    revalidatePath("/admin/attendance");
    revalidatePath("/attendance");
    return {
      error: null,
      recorded: true as const,
      alreadyRecorded: false as const,
      status: row.status as string,
      fullName: profile.full_name,
      workDate,
      scannedAt,
    };
  }

  if (code === "already_recorded") {
    const existing = workDate
      ? await supabase
          .from("presence")
          .select("status, scanned_at, work_date")
          .eq("user_id", profile.id)
          .eq("work_date", workDate)
          .maybeSingle()
      : { data: null };

    return {
      error: messageForPresenceCode(code),
      recorded: false as const,
      alreadyRecorded: true as const,
      status: existing.data?.status ?? null,
      fullName: profile.full_name,
      workDate: existing.data?.work_date ?? workDate,
      scannedAt: existing.data?.scanned_at ?? null,
    };
  }

  return {
    error: messageForPresenceCode(code ?? null),
    recorded: false as const,
    alreadyRecorded: false as const,
    fullName: profile.full_name,
  };
}

export async function autoRecordActivePresence() {
  const profile = await requireScanner();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("qr_codes")
    .select("token, valid_until, is_active")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(5);

  if (error) {
    return {
      error: "Unable to read today's presence QR code.",
      recorded: false as const,
      alreadyRecorded: false as const,
      fullName: profile.full_name,
    };
  }

  const live = (data ?? []).find((code) => isLiveQr(code));
  const token = live?.token ?? null;

  if (!token) {
    return {
      error: NO_ACTIVE_QR,
      recorded: false as const,
      alreadyRecorded: false as const,
      fullName: profile.full_name,
    };
  }

  return recordPresenceScan(token);
}
