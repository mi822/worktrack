import { createClient } from "@/lib/supabase/server";
import { averageRating, responseRate } from "@/lib/surveys/score";
import {
  isSurveyQuestionKind,
  type SurveyListItem,
  type SurveyQuestion,
  type SurveyRecord,
} from "@/lib/surveys/types";
import type { Profile } from "@/lib/types";

function asSurvey(row: {
  id: number | string;
  created_by: string;
  title: string;
  description: string;
  is_published: boolean;
  starts_on: string | null;
  ends_on: string | null;
  created_at: string;
}): SurveyRecord {
  return {
    id: Number(row.id),
    created_by: row.created_by,
    title: row.title,
    description: row.description,
    is_published: row.is_published,
    starts_on: row.starts_on,
    ends_on: row.ends_on,
    created_at: row.created_at,
  };
}

function asQuestion(row: {
  id: number | string;
  sort_order: number;
  prompt: string;
  kind: string;
  options: unknown;
}): SurveyQuestion | null {
  if (!isSurveyQuestionKind(row.kind)) {
    return null;
  }
  const options = Array.isArray(row.options)
    ? row.options.filter((item): item is string => typeof item === "string")
    : [];
  return {
    id: Number(row.id),
    sort_order: row.sort_order,
    prompt: row.prompt,
    kind: row.kind,
    options,
  };
}

export function canManageSurveys(profile: Profile) {
  return profile.role === "admin" || profile.role === "manager";
}

export function canEditSurvey(profile: Profile, survey: SurveyRecord) {
  return profile.role === "admin" || survey.created_by === profile.id;
}

export async function listSurveys(profile: Profile): Promise<SurveyListItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("surveys")
    .select(
      "id, created_by, title, description, is_published, starts_on, ends_on, created_at",
    )
    .order("created_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  const surveys = data.map(asSurvey);
  const ids = surveys.map((survey) => survey.id);
  const questionCounts = new Map<number, number>();
  const responseCounts = new Map<number, number>();
  const mine = new Map<number, number>();

  if (ids.length > 0) {
    const [{ data: questions }, { data: responses }] = await Promise.all([
      supabase.from("survey_questions").select("id, survey_id").in("survey_id", ids),
      supabase
        .from("survey_responses")
        .select("id, survey_id, respondent_id")
        .in("survey_id", ids),
    ]);
    for (const row of questions ?? []) {
      const id = Number(row.survey_id);
      questionCounts.set(id, (questionCounts.get(id) ?? 0) + 1);
    }
    for (const row of responses ?? []) {
      const id = Number(row.survey_id);
      responseCounts.set(id, (responseCounts.get(id) ?? 0) + 1);
      if (row.respondent_id === profile.id) {
        mine.set(id, Number(row.id));
      }
    }
  }

  return surveys.map((survey) => ({
    ...survey,
    questionCount: questionCounts.get(survey.id) ?? 0,
    responseCount: responseCounts.get(survey.id) ?? 0,
    myResponseId: mine.get(survey.id) ?? null,
  }));
}

export async function getSurvey(id: number): Promise<SurveyRecord | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("surveys")
    .select(
      "id, created_by, title, description, is_published, starts_on, ends_on, created_at",
    )
    .eq("id", id)
    .maybeSingle();
  return data ? asSurvey(data) : null;
}

export async function listSurveyQuestions(
  surveyId: number,
): Promise<SurveyQuestion[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("survey_questions")
    .select("id, sort_order, prompt, kind, options")
    .eq("survey_id", surveyId)
    .order("sort_order");
  return (data ?? [])
    .map(asQuestion)
    .filter((row): row is SurveyQuestion => row !== null);
}

export async function getMySurveyResponse(
  surveyId: number,
  userId: string,
) {
  const supabase = await createClient();
  const { data: response } = await supabase
    .from("survey_responses")
    .select("id, submitted_at")
    .eq("survey_id", surveyId)
    .eq("respondent_id", userId)
    .maybeSingle();
  if (!response) {
    return null;
  }
  const { data: answers } = await supabase
    .from("survey_answers")
    .select("question_id, rating_value, choice_value, yes_no_value, text_value")
    .eq("response_id", response.id);
  return {
    id: Number(response.id),
    submitted_at: response.submitted_at as string,
    answers: answers ?? [],
  };
}

export type SurveyResults = {
  responseCount: number;
  avgRating: number | null;
  answers: {
    respondent_id: string;
    respondent_name: string;
    question_id: number;
    rating_value: number | null;
    choice_value: string | null;
    yes_no_value: boolean | null;
    text_value: string | null;
  }[];
};

export async function getSurveyResults(surveyId: number): Promise<SurveyResults> {
  const supabase = await createClient();
  const { data: responses } = await supabase
    .from("survey_responses")
    .select("id, respondent_id")
    .eq("survey_id", surveyId);
  const responseRows = responses ?? [];
  const names = new Map<string, string>();
  const respondentIds = [...new Set(responseRows.map((row) => row.respondent_id))];
  if (respondentIds.length > 0) {
    const { data: people } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", respondentIds);
    for (const person of people ?? []) {
      names.set(person.id, person.full_name);
    }
  }
  const responseIds = responseRows.map((row) => Number(row.id));
  let answerRows: {
    response_id: number | string;
    question_id: number | string;
    rating_value: number | null;
    choice_value: string | null;
    yes_no_value: boolean | null;
    text_value: string | null;
  }[] = [];
  if (responseIds.length > 0) {
    const { data } = await supabase
      .from("survey_answers")
      .select(
        "response_id, question_id, rating_value, choice_value, yes_no_value, text_value",
      )
      .in("response_id", responseIds);
    answerRows = data ?? [];
  }
  const responseById = new Map(
    responseRows.map((row) => [Number(row.id), row.respondent_id]),
  );
  const ratings = answerRows
    .map((row) => row.rating_value)
    .filter((value): value is number => value !== null);
  return {
    responseCount: responseRows.length,
    avgRating: averageRating(ratings),
    answers: answerRows.map((row) => {
      const respondentId = responseById.get(Number(row.response_id)) ?? "";
      return {
        respondent_id: respondentId,
        respondent_name: names.get(respondentId) ?? "Unknown",
        question_id: Number(row.question_id),
        rating_value: row.rating_value,
        choice_value: row.choice_value,
        yes_no_value: row.yes_no_value,
        text_value: row.text_value,
      };
    }),
  };
}

export async function getEngagementOverview(): Promise<{
  responseCount: number;
  audienceCount: number;
  avgRating: number | null;
  responseRate: number | null;
}> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("engagement_overview");
  if (error || !data || data.length === 0) {
    return {
      responseCount: 0,
      audienceCount: 0,
      avgRating: null,
      responseRate: null,
    };
  }
  const row = Array.isArray(data) ? data[0] : data;
  const audience = Number(row.audience_count ?? 0);
  const responses = Number(row.response_count ?? 0);
  return {
    responseCount: responses,
    audienceCount: audience,
    avgRating: row.avg_rating === null ? null : Number(row.avg_rating),
    responseRate:
      row.response_rate === null
        ? responseRate(responses, audience)
        : Number(row.response_rate),
  };
}
