import { EmployeeSummaryForm } from "@/app/summary/summary-form";
import { AppShell } from "@/components/app-shell";
import { requireEmployee } from "@/lib/auth";
import { formatDate } from "@/lib/format-date";
import { getTodayEmployeeSummary } from "@/lib/logs/queries";
import { currentWorkDate } from "@/lib/logs/work-date";

export default async function SummaryPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const profile = await requireEmployee();
  const { date } = await currentWorkDate();
  const summary = await getTodayEmployeeSummary(profile.id, date);
  const params = await searchParams;
  const error = params.error?.trim() ? params.error : null;
  const saved = params.saved === "1";

  return (
    <AppShell profile={profile}>
      <p className="field-caption">Employee</p>
      <h1 className="page-title mt-1">End of day</h1>
      <p className="page-lede">
        One summary for {formatDate(date)}. Saving again updates today’s row.
      </p>
      {summary ? null : (
        <p className="mt-6 rounded-xl border border-dashed border-line bg-canvas/60 px-4 py-3 text-sm text-muted">
          Not submitted.
        </p>
      )}
      <EmployeeSummaryForm summary={summary} error={error} saved={saved} />
    </AppShell>
  );
}
