import { InternLogForm } from "@/app/learning-log/log-form";
import { AppShell } from "@/components/app-shell";
import { requireIntern } from "@/lib/auth";
import { formatDate } from "@/lib/format-date";
import { getTodayInternLog } from "@/lib/logs/queries";
import { currentWorkDate } from "@/lib/logs/work-date";

export default async function LearningLogPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const profile = await requireIntern();
  const { date } = await currentWorkDate();
  const log = await getTodayInternLog(profile.id, date);
  const params = await searchParams;
  const error = params.error?.trim() ? params.error : null;
  const saved = params.saved === "1";

  return (
    <AppShell profile={profile}>
      <p className="field-caption">Intern</p>
      <h1 className="page-title mt-1">Learning log</h1>
      <p className="page-lede">
        One log for {formatDate(date)}. Saving again updates today’s row.
      </p>
      {log ? null : (
        <p className="mt-6 rounded-xl border border-dashed border-line bg-canvas/60 px-4 py-3 text-sm text-muted">
          Not submitted.
        </p>
      )}
      <InternLogForm log={log} error={error} saved={saved} />
    </AppShell>
  );
}
