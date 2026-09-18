import { QrManager } from "@/app/admin/qr/qr-manager";
import { AppShell } from "@/components/app-shell";
import { formatDateTime } from "@/lib/format-date";
import { requireAdmin } from "@/lib/auth";
import {
  getActiveQrPresentation,
  listQrCodes,
} from "@/lib/presence/qr-actions";
import { isLiveQr } from "@/lib/presence/qr-live";

export default async function AdminQrPage() {
  const profile = await requireAdmin();
  const [codes, activePresentation] = await Promise.all([
    listQrCodes(),
    getActiveQrPresentation(),
  ]);
  const codesForUi = codes.map((code) => ({
    ...code,
    live: isLiveQr(code),
    validUntilLabel: code.valid_until
      ? `Valid until ${formatDateTime(code.valid_until)}`
      : "No expiry",
  }));
  const staleActive =
    codes.find((code) => code.is_active && !isLiveQr(code)) ?? null;

  return (
    <AppShell profile={profile}>
      <p className="field-caption">Admin</p>
      <h1 className="page-title mt-1">Presence QR</h1>
      {staleActive ? (
        <p className="alert-error mt-6">
          The current code is marked active but its validity has ended. Generate
          a new code (leave Valid until empty) before people can record
          presence.
        </p>
      ) : null}
      <QrManager
        codes={codesForUi}
        activeImage={activePresentation?.image ?? null}
        scanUrl={activePresentation?.scanUrl ?? null}
      />
    </AppShell>
  );
}
