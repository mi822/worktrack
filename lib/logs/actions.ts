"use server";

import { requireEmployee, requireIntern } from "@/lib/auth";
import { requiredText } from "@/lib/logs/types";
import { currentWorkDate } from "@/lib/logs/work-date";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function fail(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

export async function saveEmployeeSummary(formData: FormData) {
  const profile = await requireEmployee();
  const parsed = requiredText(formData, [
    { name: "work_completed", label: "Work completed" },
    { name: "challenges", label: "Challenges" },
    { name: "general_progress", label: "General progress" },
    { name: "planned_next_day", label: "Planned work for the next day" },
  ]);
  if (parsed.error) {
    fail("/summary", parsed.error);
  }

  const { date } = await currentWorkDate();
  const supabase = await createClient();
  const { error } = await supabase.from("employee_daily_summaries").upsert(
    {
      user_id: profile.id,
      work_date: date,
      work_completed: parsed.values.work_completed,
      challenges: parsed.values.challenges,
      general_progress: parsed.values.general_progress,
      planned_next_day: parsed.values.planned_next_day,
    },
    { onConflict: "user_id,work_date" },
  );

  if (error) {
    fail("/summary", "Unable to save today’s summary.");
  }

  revalidatePath("/summary");
  redirect("/summary?saved=1");
}

export async function saveInternLog(formData: FormData) {
  const profile = await requireIntern();
  const parsed = requiredText(formData, [
    { name: "learned", label: "What you learned" },
    { name: "activities", label: "Activities" },
    { name: "challenges", label: "Challenges" },
    { name: "skills_gained", label: "Skills gained" },
    { name: "areas_to_improve", label: "Areas to improve" },
  ]);
  if (parsed.error) {
    fail("/learning-log", parsed.error);
  }

  const { date } = await currentWorkDate();
  const supabase = await createClient();
  const { error } = await supabase.from("intern_learning_logs").upsert(
    {
      user_id: profile.id,
      work_date: date,
      learned: parsed.values.learned,
      activities: parsed.values.activities,
      challenges: parsed.values.challenges,
      skills_gained: parsed.values.skills_gained,
      areas_to_improve: parsed.values.areas_to_improve,
    },
    { onConflict: "user_id,work_date" },
  );

  if (error) {
    fail("/learning-log", "Unable to save today’s learning log.");
  }

  revalidatePath("/learning-log");
  revalidatePath("/intern-logs");
  redirect("/learning-log?saved=1");
}
