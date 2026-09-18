import { PresenceResult } from "@/app/scan/presence-result";
import { AppShell } from "@/components/app-shell";
import { requireScanner } from "@/lib/auth";
import { formatDate, formatTime } from "@/lib/format-date";
import {
  getMyPresenceToday,
  recordPresenceScan,
} from "@/lib/presence/presence-actions";

export default async function ShortScanPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const profile = await requireScanner();
  const { token } = await params;
  const today = await getMyPresenceToday();

  if (!today.configured) {
    return (
      <AppShell profile={profile}>
        <p className="field-caption">Presence</p>
        <h1 className="page-title mt-1">Today&apos;s Presence</h1>
        <p className="mt-6 rounded-lg border border-dashed border-line bg-white px-4 py-6 text-center text-sm text-muted">
          Working hours are not configured.
        </p>
      </AppShell>
    );
  }

  if (today.record) {
    return (
      <AppShell profile={profile}>
        <p className="field-caption">Presence</p>
        <h1 className="page-title mt-1">Today&apos;s Presence</h1>
        <PresenceResult
          alreadyRecorded
          recordedStatus={today.record.status}
          fullName={profile.full_name}
          workDate={formatDate(today.record.work_date)}
          scannedAt={formatTime(today.record.scanned_at)}
        />
      </AppShell>
    );
  }

  const result = await recordPresenceScan(token);

  return (
    <AppShell profile={profile}>
      <p className="field-caption">Presence</p>
      <h1 className="page-title mt-1">Today&apos;s Presence</h1>
      <PresenceResult
        alreadyRecorded={result.alreadyRecorded}
        recordedStatus={result.recorded ? result.status : null}
        error={result.recorded || result.alreadyRecorded ? null : result.error}
        fullName={result.fullName ?? profile.full_name}
        workDate={result.workDate ? formatDate(result.workDate) : null}
        scannedAt={result.scannedAt ? formatTime(result.scannedAt) : null}
      />
    </AppShell>
  );
}
