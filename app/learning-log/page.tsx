import { InternLogForm } from "@/app/learning-log/log-form";
import { AppShell } from "@/components/app-shell";
import { PageHeader, StatusPill } from "@/components/dashboard/ui";
import { formatDate } from "@/lib/format-date";
import { requireIntern } from "@/lib/auth";
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
      <PageHeader
        icon="/learning-log"
        caption="Intern"
        title="Learning log"
        description={`What you learned today · ${formatDate(date)}`}
        actions={
          <StatusPill tone={log ? "ok" : "warn"}>
            {log ? "Submitted" : "Not submitted"}
          </StatusPill>
        }
      />
      <InternLogForm log={log} error={error} saved={saved} />
    </AppShell>
  );
}
