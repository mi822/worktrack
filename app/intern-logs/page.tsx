import { AppShell } from "@/components/app-shell";
import { EmptyNote, IconTile, PageHeader } from "@/components/dashboard/ui";
import { requireProjectHead } from "@/lib/auth";
import { formatDate } from "@/lib/format-date";
import { listRelevantInternLogs } from "@/lib/logs/queries";

export default async function InternLogsPage() {
  const profile = await requireProjectHead();
  const logs = await listRelevantInternLogs();

  return (
    <AppShell profile={profile}>
      <PageHeader
        icon="/intern-logs"
        caption="Project head"
        title="Intern learning logs"
        description="Daily logs from interns on your projects"
      />

      <section className="mt-6 space-y-4">
        {logs.length === 0 ? (
          <div className="panel p-5 sm:p-6">
            <EmptyNote>No learning logs submitted.</EmptyNote>
          </div>
        ) : (
          logs.map((log) => (
            <article key={log.id} className="panel p-5 text-sm sm:p-6">
              <div className="mb-5 flex items-center gap-3">
                <IconTile label={log.intern_name ?? "Intern"} seed={log.id} />
                <div>
                  <p className="text-base font-bold text-ink">
                    {log.intern_name ?? "Intern"}
                  </p>
                  <p className="text-xs text-muted">{formatDate(log.work_date)}</p>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <LogField label="What they learned">{log.learned}</LogField>
                <LogField label="Activities">{log.activities}</LogField>
                <LogField label="Challenges">{log.challenges}</LogField>
                <LogField label="Skills gained">{log.skills_gained}</LogField>
                <LogField label="Areas to improve">{log.areas_to_improve}</LogField>
              </div>
            </article>
          ))
        )}
      </section>
    </AppShell>
  );
}

function LogField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="stat-tile">
      <p className="text-xs font-medium text-muted">{label}</p>
      <p className="mt-1 whitespace-pre-line text-ink">{children}</p>
    </div>
  );
}
