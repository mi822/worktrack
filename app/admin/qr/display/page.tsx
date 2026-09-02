import { requireAdmin } from "@/lib/auth";
import { listQrCodes, qrImageDataUrl } from "@/lib/presence/qr-actions";
import { isLiveQr } from "@/lib/presence/qr-live";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function QrDisplayPage() {
  await requireAdmin();
  const codes = await listQrCodes();
  const active = codes.find((code) => isLiveQr(code)) ?? null;
  if (!active) {
    redirect("/admin/qr");
  }
  const activeImage = await qrImageDataUrl(active.token);

  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-white px-6 py-10">
      <p className="max-w-md text-center text-sm text-stone-600">
        Point your phone camera at this code and hold still. Tap the banner or
        link that appears, then sign in as a non-admin.
      </p>
      <div className="mt-6 bg-white p-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={activeImage}
          alt="Active organization QR code"
          className="block h-[min(80vw,72vh)] w-[min(80vw,72vh)]"
        />
      </div>
      <Link href="/admin/qr" className="btn-secondary mt-8">
        Back to QR
      </Link>
    </div>
  );
}
