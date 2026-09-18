"use server";

import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

function refreshNotices() {
  revalidatePath("/", "layout");
}

export async function markNotificationRead(formData: FormData) {
  await requireProfile();
  const id = Number.parseInt(String(formData.get("id") ?? ""), 10);
  if (!Number.isFinite(id)) {
    return;
  }

  const supabase = await createClient();
  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id)
    .is("read_at", null);
  refreshNotices();
}

export async function markAllNotificationsRead() {
  await requireProfile();
  const supabase = await createClient();
  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .is("read_at", null);
  refreshNotices();
}
