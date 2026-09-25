import { AppShell } from "@/components/app-shell";
import {
  EmptyNote,
  IconTile,
  PageHeader,
  SectionHeader,
  StatusPill,
} from "@/components/dashboard/ui";
import { NavIcon } from "@/components/nav-icon";
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
      <PageHeader
        icon="/surveys"
        caption={ROLE_LABEL[profile.role]}
        title="Surveys"
        description="Engagement surveys for the team"
        actions={
          manage ? (
            <Link href="/surveys/new" className="btn-primary gap-2">
              <NavIcon href="plus" />
              New survey
            </Link>
          ) : null
        }
      />
      {error ? <p className="alert-error mt-6">{error}</p> : null}
      <section className="panel mt-6 p-5 sm:p-6">
        <SectionHeader
          icon="/surveys"
          title="All surveys"
          description={`${surveys.length} ${surveys.length === 1 ? "survey" : "surveys"}`}
        />
        {surveys.length === 0 ? (
          <EmptyNote>No surveys yet.</EmptyNote>
        ) : (
          <ul className="card-list">
            {surveys.map((survey) => (
              <li key={survey.id}>
                <Link
                  href={`/surveys/${survey.id}`}
                  className="card-row outline-none focus-visible:ring-2 focus-visible:ring-action/20"
                >
                  <IconTile label={survey.title} seed={survey.id} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-ink">{survey.title}</p>
                      <StatusPill tone={survey.is_published ? "ok" : "muted"}>
                        {survey.is_published ? "Published" : "Draft"}
                      </StatusPill>
                      {survey.myResponseId ? (
                        <StatusPill tone="action">Submitted</StatusPill>
                      ) : null}
                    </div>
                    <p className="mt-1 text-sm text-muted">
                      {survey.questionCount} questions
                      {manage ? ` · ${survey.responseCount} responses` : ""}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </AppShell>
  );
}
