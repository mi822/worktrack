import { SurveyTakeForm } from "@/app/surveys/take-form";
import { FormSubmitButton } from "@/components/form-submit-button";
import { AppShell } from "@/components/app-shell";
import { requireProfile } from "@/lib/auth";
import { formatDateTime } from "@/lib/format-date";
import { ROLE_LABEL } from "@/lib/roles";
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
      <p className="field-caption">{ROLE_LABEL[profile.role]}</p>
      <h1 className="page-title mt-1">{survey.title}</h1>
      <p className="mt-2 text-sm text-muted">
        {survey.is_published ? "Published" : "Draft"}
        {survey.description ? ` · ${survey.description}` : ""}
      </p>
      <p className="mt-4 text-sm">
        <Link href="/surveys" className="text-muted underline-offset-2 hover:text-ink hover:underline">
          Back to surveys
        </Link>
        {manage && !survey.is_published ? (
          <>
            <span className="mx-2 text-muted">·</span>
            <Link href={`/surveys/${id}/edit`} className="text-muted underline-offset-2 hover:text-ink hover:underline">
              Edit
            </Link>
          </>
        ) : null}
        {manage ? (
          <>
            <span className="mx-2 text-muted">·</span>
            <Link href={`/surveys/${id}/results`} className="text-muted underline-offset-2 hover:text-ink hover:underline">
              Results
            </Link>
          </>
        ) : null}
      </p>
      {error ? <p className="alert-error mt-6">{error}</p> : null}
      {saved ? (
        <p className="mt-6 rounded-lg border border-line bg-canvas px-3 py-2 text-sm text-ink">
          Response saved.
        </p>
      ) : null}

      {manage ? (
        <form action={setSurveyPublished} className="mt-6">
          <input type="hidden" name="survey_id" value={id} />
          <input type="hidden" name="publish" value={survey.is_published ? "0" : "1"} />
          <FormSubmitButton pendingLabel="Updating…">
            {survey.is_published ? "Unpublish" : "Publish"}
          </FormSubmitButton>
        </form>
      ) : null}

      <section className="panel mt-8 p-6">
        <h2 className="text-sm font-semibold tracking-tight">Questions</h2>
        <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm">
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
