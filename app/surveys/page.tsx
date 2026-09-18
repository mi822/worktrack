import { AppShell } from "@/components/app-shell";
import { EmptyNote } from "@/components/dashboard/ui";
import { requireProfile } from "@/lib/auth";
import { ROLE_LABEL } from "@/lib/roles";
import { canManageSurveys, listSurveys } from "@/lib/surveys/queries";
import Link from "next/link";

export default async function SurveysPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const profile = await requireProfile();
  const surveys = await listSurveys(profile);
  const manage = canManageSurveys(profile);
  const error = (await searchParams).error?.trim() || null;

  return (
    <AppShell profile={profile}>
      <p className="field-caption">{ROLE_LABEL[profile.role]}</p>
      <h1 className="page-title mt-1">Surveys</h1>
      {error ? <p className="alert-error mt-6">{error}</p> : null}
      {manage ? (
        <p className="mt-4 text-sm">
          <Link href="/surveys/new" className="btn-primary">
            New survey
          </Link>
        </p>
      ) : null}
      <section className="panel mt-8 p-6">
        {surveys.length === 0 ? (
          <EmptyNote>No surveys yet.</EmptyNote>
        ) : (
          <ul className="divide-y divide-line">
            {surveys.map((survey) => (
              <li key={survey.id} className="py-4 first:pt-0 last:pb-0">
                <Link
                  href={`/surveys/${survey.id}`}
                  className="block rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-action/20"
                >
                  <p className="text-sm font-medium text-ink">{survey.title}</p>
                  <p className="mt-1 text-sm text-muted">
                    {survey.is_published ? "Published" : "Draft"}
                    {" · "}
                    {survey.questionCount} questions
                    {manage ? ` · ${survey.responseCount} responses` : ""}
                    {survey.myResponseId ? " · Submitted" : ""}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </AppShell>
  );
}
