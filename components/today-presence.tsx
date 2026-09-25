import { RegisterPresencePanel } from "@/components/register-presence-panel";
import { DashSection, StatusPill } from "@/components/dashboard/ui";
import { HOURS_UNSET_HINT } from "@/lib/dashboards/empty-copy";
import { requireProfile } from "@/lib/auth";
import { formatDate, formatTime } from "@/lib/format-date";
import { getMyPresenceToday } from "@/lib/presence/presence-actions";
import { getActivePresenceQrForScan } from "@/lib/presence/qr-actions";

export async function TodayPresence({ notice }: { notice?: string | null }) {
  const profile = await requireProfile();
  const data = await getMyPresenceToday();
  void notice;

  let body: React.ReactNode;
  if (!data.configured) {
    body = <p className="text-sm text-muted">{HOURS_UNSET_HINT}</p>;
  } else if (data.record) {
    body = (
      <div className="space-y-2">
        <p className="text-sm text-ink">
          Status:{" "}
          <StatusPill tone={data.record.status === "present" ? "ok" : "warn"}>
            {data.record.status === "present" ? "Present Today" : "Late"}
          </StatusPill>
        </p>
        <p className="text-sm text-muted">
          {formatDate(data.record.work_date)} · {formatTime(data.record.scanned_at)}
        </p>
        <p className="text-sm font-medium text-ink">
          You have already registered your presence today.
        </p>
      </div>
    );
  } else if (profile.role === "admin") {
    body = (
      <p className="text-sm text-muted">
        Admin accounts do not register daily presence.
      </p>
    );
  } else {
    const activeQr = await getActivePresenceQrForScan();
    body = (
      <RegisterPresencePanel
        fullName={profile.full_name}
        qrImage={activeQr?.image ?? null}
      />
    );
  }

  return (
    <DashSection
      title="Today's presence"
      description="Your presence status for today"
      icon="/scan"
    >
      {body}
    </DashSection>
  );
}
