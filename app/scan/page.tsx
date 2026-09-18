import { PresenceResult } from "@/app/scan/presence-result";
import { AppShell } from "@/components/app-shell";
import { RegisterPresencePanel } from "@/components/register-presence-panel";
import { requireScanner } from "@/lib/auth";
import { formatDate, formatTime } from "@/lib/format-date";
import { getActivePresenceQrForScan } from "@/lib/presence/qr-actions";
import {
  getMyPresenceToday,
  recordPresenceScan,
} from "@/lib/presence/presence-actions";
import { tokenFromScanPayload } from "@/lib/presence/scan-payload";

const NO_ACTIVE_QR =
  "Today's presence QR code has not been generated yet. Please contact the administrator.";

export default async function ScanPage({
  searchParams,
}: {
  searchParams: Promise<{ t?: string }>;
}) {
  const profile = await requireScanner();
  const today = await getMyPresenceToday();
  const params = await searchParams;
  const linkToken = params.t ? tokenFromScanPayload(params.t) : "";

  const activeQr =
    !today.record && !linkToken && today.configured
      ? await getActivePresenceQrForScan()
      : null;

  return (
    <AppShell profile={profile}>
      <p className="field-caption">Presence</p>
      <h1 className="page-title mt-1">Today&apos;s Presence</h1>

      {!today.configured ? (
        <p className="mt-6 rounded-lg border border-dashed border-line bg-white px-4 py-6 text-center text-sm text-muted">
          Working hours are not configured.
        </p>
      ) : today.record ? (
        <div className="mt-6">
          <PresenceResult
            alreadyRecorded
            recordedStatus={today.record.status}
            fullName={profile.full_name}
            workDate={formatDate(today.record.work_date)}
            scannedAt={formatTime(today.record.scanned_at)}
          />
        </div>
      ) : linkToken ? (
        <LinkScan token={linkToken} fullName={profile.full_name} />
      ) : !activeQr ? (
        <p className="mt-6 rounded-lg border border-dashed border-line bg-white px-4 py-6 text-center text-sm text-muted">
          {NO_ACTIVE_QR}
        </p>
      ) : (
        <div className="mt-6">
          <RegisterPresencePanel
            fullName={profile.full_name}
            qrImage={activeQr.image}
          />
        </div>
      )}
    </AppShell>
  );
}

async function LinkScan({
  token,
  fullName,
}: {
  token: string;
  fullName: string;
}) {
  const result = await recordPresenceScan(token);
  return (
    <PresenceResult
      alreadyRecorded={result.alreadyRecorded}
      recordedStatus={result.recorded ? result.status : null}
      error={result.recorded || result.alreadyRecorded ? null : result.error}
      fullName={result.fullName ?? fullName}
      workDate={result.workDate ? formatDate(result.workDate) : null}
      scannedAt={result.scannedAt ? formatTime(result.scannedAt) : null}
    />
  );
}
