import { PresenceResult } from "@/app/scan/presence-result";
import { AppShell } from "@/components/app-shell";
import { EmptyNote, PageHeader } from "@/components/dashboard/ui";
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
      <PageHeader
        icon="/scan"
        caption="Presence"
        title="Today's presence"
        description="Scan the office QR code to record that you are here"
      />

      {!today.configured ? (
        <div className="mt-6">
          <EmptyNote>Working hours are not configured.</EmptyNote>
        </div>
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
        <div className="mt-6">
          <EmptyNote>{NO_ACTIVE_QR}</EmptyNote>
        </div>
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
