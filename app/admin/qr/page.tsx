import { QrManager } from "@/app/admin/qr/qr-manager";
import { AppShell } from "@/components/app-shell";
import { formatDateTime } from "@/lib/format-date";
import { requireAdmin } from "@/lib/auth";
import { listQrCodes, qrImageDataUrl } from "@/lib/presence/qr-actions";
import { isLiveQr } from "@/lib/presence/qr-live";
import { qrScanUrl } from "@/lib/presence/scan-origin";

export default async function AdminQrPage() {
  const profile = await requireAdmin();
  const codes = await listQrCodes();
  const codesForUi = codes.map((code) => ({
    ...code,
    live: isLiveQr(code),
    validUntilLabel: code.valid_until
      ? `Valid until ${formatDateTime(code.valid_until)}`
      : "No expiry",
  }));
  const active = codes.find((code) => isLiveQr(code)) ?? null;
  const staleActive = codes.find((code) => code.is_active && !isLiveQr(code)) ?? null;
  const activeImage = active ? await qrImageDataUrl(active.token) : null;
  const scanUrl = active ? await qrScanUrl(active.token) : null;

  return (
    <AppShell profile={profile}>
      <p className="field-caption">Admin</p>
      <h1 className="page-title mt-1">Organization QR</h1>
      <p className="page-lede">
        Only one code is active at a time. People scan it with their phone
        camera. Deactivated or expired codes cannot record presence. Leave
        “Valid until” empty unless the code should expire.
      </p>
      {staleActive ? (
        <p className="alert-error mt-6">
          The current code is marked active but its validity has ended. Generate
          a new code (leave Valid until empty) before people can record
          presence.
        </p>
      ) : null}
      <QrManager codes={codesForUi} activeImage={activeImage} scanUrl={scanUrl} />
    </AppShell>
  );
}
