import { EmployeeSummaryForm } from "@/app/summary/summary-form";
import { AppShell } from "@/components/app-shell";
import { PageHeader, StatusPill } from "@/components/dashboard/ui";
import { formatDate } from "@/lib/format-date";
import { requireEmployee } from "@/lib/auth";
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
      <PageHeader
        icon="/summary"
        caption="Employee"
        title="End of day"
        description={`Your daily summary · ${formatDate(date)}`}
        actions={
          <StatusPill tone={summary ? "ok" : "warn"}>
            {summary ? "Submitted" : "Not submitted"}
          </StatusPill>
        }
      />
      <EmployeeSummaryForm summary={summary} error={error} saved={saved} />
    </AppShell>
  );
}
