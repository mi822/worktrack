import { AppShell } from "@/components/app-shell";
import { EmptyNote, Stat, StatGrid } from "@/components/dashboard/ui";
import { requireProfile } from "@/lib/auth";
import { ROLE_LABEL } from "@/lib/roles";
import {
  canEditSurvey,
  getSurvey,
  getSurveyResults,
  listSurveyQuestions,
} from "@/lib/surveys/queries";
import { parseIdParam } from "@/lib/work/parse";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function SurveyResultsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const profile = await requireProfile();
  const id = parseIdParam((await params).id);
  if (!id) {
    notFound();
  }
  const survey = await getSurvey(id);
  if (!survey || !canEditSurvey(profile, survey)) {
    notFound();
  }
  const [questions, results] = await Promise.all([
    listSurveyQuestions(id),
    getSurveyResults(id),
  ]);
  const prompts = new Map(questions.map((question) => [question.id, question.prompt]));

  return (
    <AppShell profile={profile}>
      <p className="field-caption">{ROLE_LABEL[profile.role]}</p>
      <h1 className="page-title mt-1">Results · {survey.title}</h1>
      <p className="mt-4 text-sm">
        <Link href={`/surveys/${id}`} className="text-muted underline-offset-2 hover:text-ink hover:underline">
          Back to survey
        </Link>
      </p>
      <section className="panel mt-8 p-6">
        <StatGrid>
          <Stat label="Responses" value={results.responseCount} />
          <Stat
            label="Average rating"
            value={results.avgRating ?? "—"}
            tone="action"
          />
        </StatGrid>
      </section>
      <section className="panel mt-6 p-6">
        <h2 className="text-sm font-semibold tracking-tight">Answers</h2>
        {results.answers.length === 0 ? (
          <div className="mt-4">
            <EmptyNote>No responses yet.</EmptyNote>
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-line text-sm">
            {results.answers.map((answer, index) => (
              <li key={`${answer.respondent_id}-${answer.question_id}-${index}`} className="py-3">
                <p className="font-medium text-ink">{answer.respondent_name}</p>
                <p className="text-muted">{prompts.get(answer.question_id)}</p>
                <p className="mt-1 text-ink">
                  {answer.rating_value ??
                    answer.choice_value ??
                    (answer.yes_no_value === null
                      ? answer.text_value
                      : answer.yes_no_value
                        ? "Yes"
                        : "No")}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </AppShell>
  );
}
