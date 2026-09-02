import { HoursForm } from "@/app/admin/hours/hours-form";
import { AppShell } from "@/components/app-shell";
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
      <p className="field-caption">Admin</p>
      <h1 className="page-title mt-1">Working hours</h1>
      <p className="page-lede">
        Presence status uses these values. They are stored in the database, not
        guessed from the browser.
      </p>
      {schedule ? null : (
        <p className="mt-6 rounded-xl border border-dashed border-line bg-canvas/60 px-4 py-3 text-sm text-muted">
          Working hours are not configured.
        </p>
      )}
      <HoursForm schedule={schedule} error={error} saved={saved} />
    </AppShell>
  );
}
