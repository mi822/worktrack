import { createClient } from "@/lib/supabase/server";
import type { EmployeeSummary, InternLearningLog } from "@/lib/logs/types";

export async function getTodayEmployeeSummary(
  userId: string,
  workDate: string,
): Promise<EmployeeSummary | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("employee_daily_summaries")
    .select(
      "id, user_id, work_date, work_completed, challenges, general_progress, planned_next_day, updated_at",
    )
    .eq("user_id", userId)
    .eq("work_date", workDate)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return {
    id: Number(data.id),
    user_id: data.user_id,
    work_date: data.work_date,
    work_completed: data.work_completed,
    challenges: data.challenges,
    general_progress: data.general_progress,
    planned_next_day: data.planned_next_day,
    updated_at: data.updated_at,
  };
}

export async function getTodayInternLog(
  userId: string,
  workDate: string,
): Promise<InternLearningLog | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("intern_learning_logs")
    .select(
      "id, user_id, work_date, learned, activities, challenges, skills_gained, areas_to_improve, updated_at",
    )
    .eq("user_id", userId)
    .eq("work_date", workDate)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return {
    id: Number(data.id),
    user_id: data.user_id,
    work_date: data.work_date,
    learned: data.learned,
    activities: data.activities,
    challenges: data.challenges,
    skills_gained: data.skills_gained,
    areas_to_improve: data.areas_to_improve,
    updated_at: data.updated_at,
    intern_name: null,
  };
}

export async function listRelevantInternLogs(): Promise<InternLearningLog[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("intern_learning_logs")
    .select(
      "id, user_id, work_date, learned, activities, challenges, skills_gained, areas_to_improve, updated_at",
    )
    .order("work_date", { ascending: false });

  if (error || !data) {
    return [];
  }

  const ids = [...new Set(data.map((row) => row.user_id))];
  const names = new Map<string, string>();
  if (ids.length > 0) {
    const { data: people } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", ids);
    for (const person of people ?? []) {
      names.set(person.id, person.full_name);
    }
  }

  return data.map((row) => ({
    id: Number(row.id),
    user_id: row.user_id,
    work_date: row.work_date,
    learned: row.learned,
    activities: row.activities,
    challenges: row.challenges,
    skills_gained: row.skills_gained,
    areas_to_improve: row.areas_to_improve,
    updated_at: row.updated_at,
    intern_name: names.get(row.user_id) ?? null,
  }));
}
