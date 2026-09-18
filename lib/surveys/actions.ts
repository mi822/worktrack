"use server";

import { requireProfile } from "@/lib/auth";
import { SURVEY_TEMPLATES, isSurveyQuestionKind } from "@/lib/surveys/types";
import { canEditSurvey, canManageSurveys, getSurvey } from "@/lib/surveys/queries";
import { parseIdParam } from "@/lib/work/parse";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function fail(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

export async function createSurvey(formData: FormData) {
  const profile = await requireProfile();
  if (!canManageSurveys(profile)) {
    fail("/surveys", "Only admins and managers can create surveys.");
  }
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const starts_on = String(formData.get("starts_on") ?? "").trim() || null;
  const ends_on = String(formData.get("ends_on") ?? "").trim() || null;
  const useTemplates = formData.get("use_templates") === "on";
  if (!title) {
    fail("/surveys/new", "Title is required.");
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("surveys")
    .insert({
      created_by: profile.id,
      title,
      description,
      starts_on,
      ends_on,
    })
    .select("id")
    .maybeSingle();
  if (error || !data) {
    fail("/surveys/new", "Unable to create the survey.");
  }
  const surveyId = Number(data.id);
  if (useTemplates) {
    await supabase.from("survey_questions").insert(
      SURVEY_TEMPLATES.map((question, index) => ({
        survey_id: surveyId,
        sort_order: index,
        prompt: question.prompt,
        kind: question.kind,
        options: question.options,
      })),
    );
  }
  revalidatePath("/surveys");
  redirect(`/surveys/${surveyId}/edit`);
}

export async function addSurveyQuestion(formData: FormData) {
  const profile = await requireProfile();
  const surveyId = parseIdParam(String(formData.get("survey_id") ?? ""));
  if (!surveyId) {
    fail("/surveys", "Unknown survey.");
  }
  const survey = await getSurvey(surveyId);
  if (!survey || !canEditSurvey(profile, survey) || survey.is_published) {
    fail(`/surveys/${surveyId}`, "This survey cannot be edited.");
  }
  const prompt = String(formData.get("prompt") ?? "").trim();
  const kindRaw = String(formData.get("kind") ?? "").trim();
  const options = String(formData.get("options") ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  if (!prompt || !isSurveyQuestionKind(kindRaw)) {
    fail(`/surveys/${surveyId}/edit`, "Prompt and type are required.");
  }
  if (kindRaw === "choice" && options.length < 2) {
    fail(`/surveys/${surveyId}/edit`, "Choice questions need at least two options.");
  }
  const supabase = await createClient();
  const { error } = await supabase.from("survey_questions").insert({
    survey_id: surveyId,
    sort_order: Date.now() % 100000,
    prompt,
    kind: kindRaw,
    options: kindRaw === "choice" ? options : [],
  });
  if (error) {
    fail(`/surveys/${surveyId}/edit`, "Unable to add the question.");
  }
  revalidatePath(`/surveys/${surveyId}/edit`);
  redirect(`/surveys/${surveyId}/edit`);
}

export async function setSurveyPublished(formData: FormData) {
  const profile = await requireProfile();
  const surveyId = parseIdParam(String(formData.get("survey_id") ?? ""));
  const publish = String(formData.get("publish") ?? "") === "1";
  if (!surveyId) {
    fail("/surveys", "Unknown survey.");
  }
  const survey = await getSurvey(surveyId);
  if (!survey || !canEditSurvey(profile, survey)) {
    fail("/surveys", "You cannot change this survey.");
  }
  if (publish) {
    const supabase = await createClient();
    const { count } = await supabase
      .from("survey_questions")
      .select("id", { count: "exact", head: true })
      .eq("survey_id", surveyId);
    if (!count) {
      fail(`/surveys/${surveyId}/edit`, "Add at least one question before publishing.");
    }
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("surveys")
    .update({ is_published: publish })
    .eq("id", surveyId);
  if (error) {
    fail(`/surveys/${surveyId}`, "Unable to update publication.");
  }
  revalidatePath("/surveys");
  redirect(`/surveys/${surveyId}`);
}

export async function submitSurveyResponse(formData: FormData) {
  const profile = await requireProfile();
  if (profile.role !== "employee" && profile.role !== "intern") {
    fail("/surveys", "Only employees and interns submit surveys.");
  }
  const surveyId = parseIdParam(String(formData.get("survey_id") ?? ""));
  if (!surveyId) {
    fail("/surveys", "Unknown survey.");
  }
  const survey = await getSurvey(surveyId);
  if (!survey?.is_published) {
    fail("/surveys", "This survey is not open.");
  }
  const supabase = await createClient();
  const { data: questions } = await supabase
    .from("survey_questions")
    .select("id, kind")
    .eq("survey_id", surveyId);
  const { data: response, error } = await supabase
    .from("survey_responses")
    .insert({ survey_id: surveyId, respondent_id: profile.id })
    .select("id")
    .maybeSingle();
  if (error || !response) {
    fail(`/surveys/${surveyId}`, "You have already submitted this survey.");
  }
  const rows = (questions ?? []).map((question) => {
    const key = `q_${question.id}`;
    const raw = String(formData.get(key) ?? "").trim();
    return {
      response_id: Number(response.id),
      question_id: Number(question.id),
      rating_value: question.kind === "rating" ? Number(raw) || null : null,
      choice_value: question.kind === "choice" ? raw || null : null,
      yes_no_value:
        question.kind === "yes_no" ? raw === "yes" : null,
      text_value: question.kind === "text" ? raw || null : null,
    };
  });
  if (rows.length > 0) {
    const inserted = await supabase.from("survey_answers").insert(rows);
    if (inserted.error) {
      fail(`/surveys/${surveyId}`, "Unable to save answers.");
    }
  }
  revalidatePath(`/surveys/${surveyId}`);
  redirect(`/surveys/${surveyId}?saved=1`);
}
