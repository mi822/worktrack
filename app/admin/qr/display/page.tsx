import { requireAdmin } from "@/lib/auth";
import { getActiveQrPresentation } from "@/lib/presence/qr-actions";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function QrDisplayPage() {
  await requireAdmin();
  const active = await getActiveQrPresentation();
  if (!active) {
    redirect("/admin/qr");
  }

  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-white px-6 py-10">
      <div className="bg-white p-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={active.image}
          alt="Active organization presence QR code"
          className="block h-[min(80vw,72vh)] w-[min(80vw,72vh)]"
        />
      </div>
      <Link href="/admin/qr" className="btn-secondary mt-8">
        Back to QR
      </Link>
    </div>
  );
}
