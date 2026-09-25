import { SurveyTakeForm } from "@/app/surveys/take-form";
import { FormSubmitButton } from "@/components/form-submit-button";
import { AppShell } from "@/components/app-shell";
import { BackLink, PageHeader, SectionHeader } from "@/components/dashboard/ui";
import { requireProfile } from "@/lib/auth";
import { formatDateTime } from "@/lib/format-date";
import { setSurveyPublished } from "@/lib/surveys/actions";
import {
  canEditSurvey,
  getMySurveyResponse,
  getSurvey,
  listSurveyQuestions,
} from "@/lib/surveys/queries";
import { parseIdParam } from "@/lib/work/parse";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function SurveyDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const profile = await requireProfile();
  const id = parseIdParam((await params).id);
  if (!id) {
    notFound();
  }
  const survey = await getSurvey(id);
  if (!survey) {
    notFound();
  }
  const questions = await listSurveyQuestions(id);
  const mine = await getMySurveyResponse(id, profile.id);
  const query = await searchParams;
  const error = query.error?.trim() || null;
  const saved = query.saved === "1";
  const manage = canEditSurvey(profile, survey);
  const canTake =
    (profile.role === "employee" || profile.role === "intern") &&
    survey.is_published &&
    !mine;

  return (
    <AppShell profile={profile}>
      <BackLink href="/surveys">Back to surveys</BackLink>
      <PageHeader
        icon="/surveys"
        caption={survey.is_published ? "Published survey" : "Draft survey"}
        title={survey.title}
        description={survey.description || undefined}
        actions={
          manage ? (
            <>
              {!survey.is_published ? (
                <Link href={`/surveys/${id}/edit`} className="btn-secondary">
                  Edit
                </Link>
              ) : null}
              <Link href={`/surveys/${id}/results`} className="btn-secondary">
                Results
              </Link>
              <form action={setSurveyPublished}>
                <input type="hidden" name="survey_id" value={id} />
                <input type="hidden" name="publish" value={survey.is_published ? "0" : "1"} />
                <FormSubmitButton pendingLabel="Updating…">
                  {survey.is_published ? "Unpublish" : "Publish"}
                </FormSubmitButton>
              </form>
            </>
          ) : null
        }
      />
      {error ? <p className="alert-error mt-6">{error}</p> : null}
      {saved ? (
        <p className="mt-6 rounded-xl border border-line bg-white px-4 py-3 text-sm text-ink">
          Response saved.
        </p>
      ) : null}

      <section className="panel mt-6 p-5 sm:p-6">
        <SectionHeader
          icon="/tasks"
          title="Questions"
          description={`${questions.length} ${questions.length === 1 ? "question" : "questions"}`}
        />
        <ol className="list-decimal space-y-2 pl-5 text-sm">
          {questions.map((question) => (
            <li key={question.id}>{question.prompt}</li>
          ))}
        </ol>
        {canTake ? <SurveyTakeForm surveyId={id} questions={questions} /> : null}
        {mine ? (
          <p className="mt-4 text-sm text-muted">
            You submitted this survey on {formatDateTime(mine.submitted_at)}.
          </p>
        ) : null}
      </section>
    </AppShell>
  );
}
