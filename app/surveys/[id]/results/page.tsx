import { AppShell } from "@/components/app-shell";
import {
  BackLink,
  EmptyNote,
  PageHeader,
  SectionHeader,
  Stat,
  StatGrid,
} from "@/components/dashboard/ui";
import { requireProfile } from "@/lib/auth";
import {
  canEditSurvey,
  getSurvey,
  getSurveyResults,
  listSurveyQuestions,
} from "@/lib/surveys/queries";
import { parseIdParam } from "@/lib/work/parse";
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
      <BackLink href={`/surveys/${id}`}>Back to survey</BackLink>
      <PageHeader icon="/performance" caption="Survey results" title={survey.title} />
      <section className="panel mt-6 p-5 sm:p-6">
        <SectionHeader icon="/performance" title="Summary" description="Responses so far" />
        <StatGrid>
          <Stat label="Responses" value={results.responseCount} tone="action" icon="/admin/users" />
          <Stat
            label="Average rating"
            value={results.avgRating ?? "—"}
            tone="violet"
            icon="/surveys"
          />
        </StatGrid>
      </section>
      <section className="panel mt-6 p-5 sm:p-6">
        <SectionHeader icon="/surveys" title="Answers" description="Every answer, by person" />
        {results.answers.length === 0 ? (
          <EmptyNote>No responses yet.</EmptyNote>
        ) : (
          <ul className="card-list text-sm">
            {results.answers.map((answer, index) => (
              <li key={`${answer.respondent_id}-${answer.question_id}-${index}`} className="card-row flex-col gap-0">
                <p className="font-semibold text-ink">{answer.respondent_name}</p>
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
