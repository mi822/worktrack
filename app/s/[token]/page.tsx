import { PresenceResult } from "@/app/scan/presence-result";
import { AppShell } from "@/components/app-shell";
import { requireScanner } from "@/lib/auth";
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
        <h1 className="page-title mt-1">Scan</h1>
        <p className="mt-8 rounded-xl border border-dashed border-line bg-canvas/60 px-4 py-8 text-center text-sm text-muted">
          Working hours are not configured.
        </p>
      </AppShell>
    );
  }

  if (today.record) {
    return (
      <AppShell profile={profile}>
        <p className="field-caption">Presence</p>
        <h1 className="page-title mt-1">Scan</h1>
        <PresenceResult
          alreadyRecorded
          recordedStatus={today.record.status}
        />
      </AppShell>
    );
  }

  const result = await recordPresenceScan(token);

  return (
    <AppShell profile={profile}>
      <p className="field-caption">Presence</p>
      <h1 className="page-title mt-1">Scan</h1>
      <p className="page-lede">
        Opening this link records today’s presence. You do not need the camera
        inside WorkTrack.
      </p>
      <PresenceResult
        alreadyRecorded={result.alreadyRecorded}
        recordedStatus={result.recorded ? result.status : null}
        error={result.recorded || result.alreadyRecorded ? null : result.error}
      />
    </AppShell>
  );
}
