import { FormSubmitButton } from "@/components/form-submit-button";
import { AppShell } from "@/components/app-shell";
import { BackLink, PageHeader, SectionHeader } from "@/components/dashboard/ui";
import { requireProfile } from "@/lib/auth";
import { addSurveyQuestion } from "@/lib/surveys/actions";
import {
  canEditSurvey,
  getSurvey,
  listSurveyQuestions,
} from "@/lib/surveys/queries";
import { parseIdParam } from "@/lib/work/parse";
import { notFound, redirect } from "next/navigation";

export default async function EditSurveyPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
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
  if (survey.is_published) {
    redirect(`/surveys/${id}`);
  }
  const questions = await listSurveyQuestions(id);
  const error = (await searchParams).error?.trim() || null;

  return (
    <AppShell profile={profile}>
      <BackLink href={`/surveys/${id}`}>Back to survey</BackLink>
      <PageHeader icon="/surveys" caption="Edit survey" title={survey.title} />
      {error ? <p className="alert-error mt-6">{error}</p> : null}
      <section className="panel mt-6 p-5 sm:p-6">
        <SectionHeader
          icon="/tasks"
          title="Questions"
          description="Add questions before you publish"
        />
        <ul className="space-y-2 text-sm">
          {questions.map((question) => (
            <li key={question.id}>
              {question.prompt}{" "}
              <span className="text-muted">({question.kind})</span>
            </li>
          ))}
        </ul>
        <form action={addSurveyQuestion} className="mt-6 space-y-4">
          <input type="hidden" name="survey_id" value={id} />
          <label className="field-label">
            <span className="field-caption">Prompt</span>
            <input name="prompt" required className="field-input" />
          </label>
          <label className="field-label">
            <span className="field-caption">Type</span>
            <select name="kind" className="field-input" defaultValue="rating">
              <option value="rating">Rating 1–5</option>
              <option value="choice">Multiple choice</option>
              <option value="yes_no">Yes / No</option>
              <option value="text">Short text</option>
            </select>
          </label>
          <label className="field-label">
            <span className="field-caption">Choice options (comma separated)</span>
            <input name="options" className="field-input" />
          </label>
          <FormSubmitButton pendingLabel="Adding…">Add question</FormSubmitButton>
        </form>
      </section>
    </AppShell>
  );
}
