import { AppShell } from "@/components/app-shell";
import { requirePerformanceAccess } from "@/lib/auth";
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
      <p className="field-caption">{ROLE_LABEL[profile.role]}</p>
      <h1 className="page-title mt-1">Performance</h1>
      {error ? <p className="alert-error mt-6">{error}</p> : null}
      {saved ? (
        <p className="mt-6 rounded-lg border border-line bg-canvas px-3 py-2 text-sm text-ink">
          Saved.
        </p>
      ) : null}

      {weights ? (
        <section className="panel mt-8 p-6">
          <h2 className="text-sm font-semibold tracking-tight">Score weights</h2>
          <p className="mt-1 text-sm text-muted">Must add up to 1.00.</p>
          <PerformanceWeightsForm weights={weights} />
        </section>
      ) : null}

      <section className="panel mt-6 p-6">
        <h2 className="text-sm font-semibold tracking-tight">People</h2>
        {subjects.length === 0 ? (
          <p className="mt-4 rounded-xl border border-dashed border-line bg-surface px-4 py-8 text-center text-sm text-muted">
            No employees or interns in scope.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-line">
            {subjects.map((subject) => (
              <li key={subject.id} className="py-3 first:pt-0 last:pb-0">
                <Link
                  href={`/performance/${subject.id}`}
                  className="block rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-action/20"
                >
                  <p className="text-sm font-medium text-ink">{subject.full_name}</p>
                  <p className="mt-1 text-sm text-muted">{ROLE_LABEL[subject.role]}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </AppShell>
  );
}
