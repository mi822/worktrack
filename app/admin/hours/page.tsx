import { HoursForm } from "@/app/admin/hours/hours-form";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/dashboard/ui";
import { requireAdmin } from "@/lib/auth";
import { getWorkSchedule } from "@/lib/presence/schedule";

export default async function AdminHoursPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const profile = await requireAdmin();
  const schedule = await getWorkSchedule();
  const params = await searchParams;
  const error = params.error?.trim() ? params.error : null;
  const saved = params.saved === "1";

  return (
    <AppShell profile={profile}>
      <PageHeader
        icon="/admin/hours"
        caption="Admin"
        title="Working hours"
        description="Working days, start and end times, and the late threshold"
      />
      {schedule ? null : (
        <p className="mt-6 rounded-xl border border-warn/20 bg-warn/5 px-4 py-3 text-sm text-warn">
          Working hours are not configured.
        </p>
      )}
      <HoursForm schedule={schedule} error={error} saved={saved} />
    </AppShell>
  );
}
