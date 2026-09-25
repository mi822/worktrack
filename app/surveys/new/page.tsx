import { FormSubmitButton } from "@/components/form-submit-button";
import { AppShell } from "@/components/app-shell";
import { BackLink, PageHeader, SectionHeader } from "@/components/dashboard/ui";
import { requireProfile } from "@/lib/auth";
import { ROLE_LABEL } from "@/lib/roles";
import { createSurvey } from "@/lib/surveys/actions";
import { canManageSurveys } from "@/lib/surveys/queries";
import { redirect } from "next/navigation";

export default async function NewSurveyPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const profile = await requireProfile();
  if (!canManageSurveys(profile)) {
    redirect("/surveys");
  }
  const error = (await searchParams).error?.trim() || null;

  return (
    <AppShell profile={profile}>
      <BackLink href="/surveys">Back to surveys</BackLink>
      <PageHeader
        icon="/surveys"
        caption={ROLE_LABEL[profile.role]}
        title="New survey"
        description="Create a survey, then add questions and publish it"
      />
      <form action={createSurvey} className="panel mt-6 space-y-4 p-5 sm:p-6">
        <SectionHeader icon="plus" title="Survey details" />
        {error ? <p className="alert-error">{error}</p> : null}
        <label className="field-label">
          <span className="field-caption">Title</span>
          <input name="title" required maxLength={160} className="field-input" />
        </label>
        <label className="field-label">
          <span className="field-caption">Description</span>
          <textarea name="description" rows={3} className="field-input" />
        </label>
        <div className="grid gap-4 min-[480px]:grid-cols-2">
          <label className="field-label">
            <span className="field-caption">Start date</span>
            <input type="date" name="starts_on" className="field-input" />
          </label>
          <label className="field-label">
            <span className="field-caption">End date</span>
            <input type="date" name="ends_on" className="field-input" />
          </label>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="use_templates" defaultChecked className="size-4" />
          Add the standard engagement questions
        </label>
        <FormSubmitButton pendingLabel="Creating…">Create survey</FormSubmitButton>
      </form>
    </AppShell>
  );
}
