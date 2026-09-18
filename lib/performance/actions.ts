"use server";

import { requireAdmin, requireManagerOrHead } from "@/lib/auth";
import {
  canViewPerformance,
  getPerformanceReport,
} from "@/lib/performance/queries";
import { isUuid } from "@/lib/work/parse";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function fail(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

export async function savePerformanceWeights(formData: FormData) {
  await requireAdmin();
  const keys = [
    "w_completion",
    "w_ontime",
    "w_attendance",
    "w_quality",
    "w_participation",
  ] as const;
  const weights = Object.fromEntries(
    keys.map((key) => [key, Number(String(formData.get(key) ?? "").trim())]),
  ) as Record<(typeof keys)[number], number>;

  const sum = keys.reduce((total, key) => total + weights[key], 0);
  if (keys.some((key) => !Number.isFinite(weights[key]) || weights[key] < 0)) {
    fail("/performance", "Each weight must be zero or a positive number.");
  }
  if (Math.abs(sum - 1) > 0.001) {
    fail("/performance", "Weights must add up to 1.00.");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("performance_settings")
    .update({
      ...weights,
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1);

  if (error) {
    fail("/performance", "Unable to save weights.");
  }
  revalidatePath("/performance");
  redirect("/performance?saved=1");
}

export async function createPerformanceReview(formData: FormData) {
  const profile = await requireManagerOrHead();
  const subjectId = String(formData.get("subject_id") ?? "").trim();
  const comments = String(formData.get("comments") ?? "").trim();
  const rating = Number.parseInt(String(formData.get("rating") ?? ""), 10);
  const path = `/performance/${subjectId}`;

  if (!isUuid(subjectId)) {
    fail("/performance", "Choose a person to review.");
  }
  if (!(await canViewPerformance(profile, subjectId))) {
    fail("/performance", "You can only review people on your projects.");
  }
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    fail(path, "Rating must be between 1 and 5.");
  }
  if (!comments || comments.length > 2000) {
    fail(path, "Comments are required.");
  }

  const report = await getPerformanceReport(subjectId);
  if (!report) {
    fail("/performance", "That person has no performance report.");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("performance_reviews").insert({
    subject_id: subjectId,
    reviewer_id: profile.id,
    period_start: report.periodStart,
    period_end: report.periodEnd,
    rating,
    comments,
    metrics: {
      score: report.breakdown.score,
      completion: report.breakdown.completion,
      ontime: report.breakdown.ontime,
      attendance: report.breakdown.attendance,
      quality: report.breakdown.quality,
      participation: report.breakdown.participation,
    },
  });

  if (error) {
    fail(path, "Unable to save the review.");
  }
  revalidatePath(path);
  redirect(`${path}?saved=1`);
}
