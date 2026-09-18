export const SURVEY_QUESTION_KINDS = [
  "rating",
  "choice",
  "yes_no",
  "text",
] as const;

export type SurveyQuestionKind = (typeof SURVEY_QUESTION_KINDS)[number];

export function isSurveyQuestionKind(
  value: string,
): value is SurveyQuestionKind {
  return (SURVEY_QUESTION_KINDS as readonly string[]).includes(value);
}

export type SurveyQuestion = {
  id: number;
  sort_order: number;
  prompt: string;
  kind: SurveyQuestionKind;
  options: string[];
};

export type SurveyRecord = {
  id: number;
  created_by: string;
  title: string;
  description: string;
  is_published: boolean;
  starts_on: string | null;
  ends_on: string | null;
  created_at: string;
};

export type SurveyListItem = SurveyRecord & {
  questionCount: number;
  responseCount: number;
  myResponseId: number | null;
};

export const SURVEY_TEMPLATES: {
  prompt: string;
  kind: SurveyQuestionKind;
  options: string[];
}[] = [
  {
    prompt: "How satisfied are you with your current project?",
    kind: "rating",
    options: [],
  },
  {
    prompt: "How would you rate your workload?",
    kind: "choice",
    options: ["Light", "Balanced", "Heavy"],
  },
  {
    prompt: "Do you have the resources needed to complete your tasks?",
    kind: "yes_no",
    options: [],
  },
  {
    prompt: "How satisfied are you with communication within your team?",
    kind: "rating",
    options: [],
  },
  {
    prompt: "How motivated are you?",
    kind: "rating",
    options: [],
  },
];
