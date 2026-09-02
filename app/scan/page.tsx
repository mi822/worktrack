import { PresenceScanner } from "@/app/scan/scanner";
import { PresenceResult } from "@/app/scan/presence-result";
import { AppShell } from "@/components/app-shell";
import { requireScanner } from "@/lib/auth";
import { PHONE_SCAN_HELP } from "@/lib/presence/phone-scan-help";
import {
  getMyPresenceToday,
  recordPresenceScan,
} from "@/lib/presence/presence-actions";
import { tokenFromScanPayload } from "@/lib/presence/scan-payload";

export default async function ScanPage({
  searchParams,
}: {
  searchParams: Promise<{ t?: string }>;
}) {
  const profile = await requireScanner();
  const today = await getMyPresenceToday();
  const params = await searchParams;
  const linkToken = params.t ? tokenFromScanPayload(params.t) : "";

  return (
    <AppShell profile={profile}>
      <p className="field-caption">Presence</p>
      <h1 className="page-title mt-1">Scan</h1>
      <p className="page-lede">
        {PHONE_SCAN_HELP} There is no Mark as Present control.
      </p>

      {!today.configured ? (
        <p className="mt-8 rounded-xl border border-dashed border-line bg-canvas/60 px-4 py-8 text-center text-sm text-muted">
          Working hours are not configured.
        </p>
      ) : today.record ? (
        <PresenceResult
          alreadyRecorded
          recordedStatus={today.record.status}
        />
      ) : linkToken ? (
        <LinkScan token={linkToken} />
      ) : (
        <PresenceScanner />
      )}
    </AppShell>
  );
}

async function LinkScan({ token }: { token: string }) {
  const result = await recordPresenceScan(token);
  return (
    <PresenceResult
      alreadyRecorded={result.alreadyRecorded}
      recordedStatus={result.recorded ? result.status : null}
      error={result.recorded || result.alreadyRecorded ? null : result.error}
    />
  );
}
