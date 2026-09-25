import { AppShell } from "@/components/app-shell";
import { EmptyNote, PageHeader, SectionHeader } from "@/components/dashboard/ui";
import { requirePerformanceAccess } from "@/lib/auth";
import { initials } from "@/lib/initials";
import {
  getPerformanceWeights,
  listPerformanceSubjects,
} from "@/lib/performance/queries";
import { ROLE_LABEL } from "@/lib/roles";
import { PerformanceWeightsForm } from "@/app/performance/weights-form";
import Link from "next/link";

export default async function PerformancePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const profile = await requirePerformanceAccess();
  const params = await searchParams;
  const error = params.error?.trim() ? params.error : null;
  const saved = params.saved === "1";
  const subjects = await listPerformanceSubjects(profile);
  const weights =
    profile.role === "admin" ? await getPerformanceWeights() : null;

  return (
    <AppShell profile={profile}>
      <PageHeader
        icon="/performance"
        caption={ROLE_LABEL[profile.role]}
        title="Performance"
        description="Scores from tasks, attendance and participation"
      />
      {error ? <p className="alert-error mt-6">{error}</p> : null}
      {saved ? (
        <p className="mt-6 rounded-xl border border-line bg-white px-4 py-3 text-sm text-ink">
          Saved.
        </p>
      ) : null}

      {weights ? (
        <section className="panel mt-6 p-5 sm:p-6">
          <SectionHeader
            icon="percent"
            title="Score weights"
            description="Must add up to 1.00"
          />
          <PerformanceWeightsForm weights={weights} />
        </section>
      ) : null}

      <section className="panel mt-6 p-5 sm:p-6">
        <SectionHeader
          icon="/admin/users"
          title="People"
          description="Open a person to see their performance report"
        />
        {subjects.length === 0 ? (
          <EmptyNote>No employees or interns in scope.</EmptyNote>
        ) : (
          <ul className="card-list">
            {subjects.map((subject) => (
              <li key={subject.id}>
                <Link
                  href={`/performance/${subject.id}`}
                  className="card-row items-center outline-none focus-visible:ring-2 focus-visible:ring-action/20"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-action/10 text-xs font-bold text-action">
                    {initials(subject.full_name)}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink">{subject.full_name}</p>
                    <p className="mt-0.5 text-sm text-muted">{ROLE_LABEL[subject.role]}</p>
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
