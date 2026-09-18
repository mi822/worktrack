import { AppShell } from "@/components/app-shell";
import { requireProjectHead } from "@/lib/auth";
import { formatDate } from "@/lib/format-date";
import { listRelevantInternLogs } from "@/lib/logs/queries";

export default async function InternLogsPage() {
  const profile = await requireProjectHead();
  const logs = await listRelevantInternLogs();

  return (
    <AppShell profile={profile}>
      <p className="field-caption">Project head</p>
      <h1 className="page-title mt-1">Intern learning logs</h1>

      <section className="mt-8 space-y-4">
        {logs.length === 0 ? (
          <div className="panel p-6">
            <p className="rounded-xl border border-dashed border-line bg-canvas/60 px-4 py-8 text-center text-sm text-muted">
              No learning logs submitted.
            </p>
          </div>
        ) : (
          logs.map((log) => (
            <article key={log.id} className="panel space-y-4 p-6 text-sm">
              <div>
                <p className="text-sm font-semibold text-ink">
                  {log.intern_name ?? "Intern"}
                </p>
                <p className="mt-1 text-muted">{formatDate(log.work_date)}</p>
              </div>
              <p>
                <span className="field-caption block">What they learned</span>
                {log.learned}
              </p>
              <p>
                <span className="field-caption block">Activities</span>
                {log.activities}
              </p>
              <p>
                <span className="field-caption block">Challenges</span>
                {log.challenges}
              </p>
              <p>
                <span className="field-caption block">Skills gained</span>
                {log.skills_gained}
              </p>
              <p>
                <span className="field-caption block">Areas to improve</span>
                {log.areas_to_improve}
              </p>
            </article>
          ))
        )}
      </section>
    </AppShell>
  );
}
