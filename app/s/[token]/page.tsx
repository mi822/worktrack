import { PresenceResult } from "@/app/scan/presence-result";
import { AppShell } from "@/components/app-shell";
import { EmptyNote, PageHeader } from "@/components/dashboard/ui";
import { requireScanner } from "@/lib/auth";
import { formatDate, formatTime } from "@/lib/format-date";
import {
  getMyPresenceToday,
  recordPresenceScan,
} from "@/lib/presence/presence-actions";

function PresenceHeader() {
  return (
    <PageHeader
      icon="/scan"
      caption="Presence"
      title="Today's presence"
      description="Scan the office QR code to record that you are here"
    />
  );
}

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
        <PresenceHeader />
        <div className="mt-6">
          <EmptyNote>Working hours are not configured.</EmptyNote>
        </div>
      </AppShell>
    );
  }

  if (today.record) {
    return (
      <AppShell profile={profile}>
        <PresenceHeader />
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
      <PresenceHeader />
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
