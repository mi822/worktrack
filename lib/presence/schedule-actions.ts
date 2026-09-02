"use server";

import { requireAdmin } from "@/lib/auth";
import { validateScheduleInput } from "@/lib/presence/schedule-input";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function saveWorkSchedule(formData: FormData) {
  await requireAdmin();
  const parsed = validateScheduleInput(formData);
  if (parsed.error || !parsed.schedule) {
    redirect(
      `/admin/hours?error=${encodeURIComponent(parsed.error ?? "Unable to save working hours.")}`,
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("work_schedules")
    .upsert({
      ...parsed.schedule,
      updated_at: new Date().toISOString(),
    })
    .select("id")
    .maybeSingle();

  if (error || !data) {
    redirect(
      `/admin/hours?error=${encodeURIComponent("Unable to save working hours.")}`,
    );
  }

  revalidatePath("/admin/hours");
  revalidatePath("/scan");
  redirect("/admin/hours?saved=1");
}
