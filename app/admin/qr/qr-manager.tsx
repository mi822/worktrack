"use client";

import { generateAndActivateQr, setQrActive } from "@/lib/presence/qr-actions";
import type { QrCodeRow } from "@/lib/presence/types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type QrCodeListItem = QrCodeRow & { validUntilLabel: string; live: boolean };

export function QrManager({
  codes,
  activeImage,
  scanUrl,
}: {
  codes: QrCodeListItem[];
  activeImage: string | null;
  scanUrl: string | null;
}) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  return (
    <div className="mt-8 space-y-8">
      {message ? <p className="alert-error">{message}</p> : null}

      <section className="panel p-6">
        <h2 className="text-sm font-semibold tracking-tight">
          Generate organization QR
        </h2>
        <p className="mt-1 text-sm text-muted">
          Generating activates the new code and deactivates any previous one.
        </p>
        <form
          className="mt-5 flex flex-wrap items-end gap-3"
          action={async (formData) => {
            const result = await generateAndActivateQr(formData);
            setMessage(result.error);
            if (!result.error) {
              router.refresh();
            }
          }}
        >
          <label className="field-label">
            <span className="field-caption">Valid until (optional)</span>
            <input
              type="datetime-local"
              name="valid_until"
              className="field-input w-auto"
            />
          </label>
          <button type="submit" className="btn-primary">
            Generate and activate
          </button>
        </form>
      </section>

      {activeImage && scanUrl ? (
        <section className="panel p-6">
          <h2 className="text-sm font-semibold tracking-tight">Active code</h2>
          <p className="mt-1 text-sm text-muted">
            Keep this page open. Hold the phone still until a link appears, then
            tap it. iPhone shows a banner at the top; some Android cameras need
            Google Lens or a QR mode in Camera settings.
          </p>
          <div className="mt-4 inline-block border border-line bg-white p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={activeImage}
              alt="Active organization QR code"
              className="block h-80 w-80"
            />
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Link href="/admin/qr/display" className="btn-primary">
              Open large view
            </Link>
            <button
              type="button"
              className="btn-secondary"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(scanUrl);
                  setCopied(true);
                  window.setTimeout(() => setCopied(false), 2000);
                } catch {
                  setMessage("Could not copy the link.");
                }
              }}
            >
              {copied ? "Link copied" : "Copy phone link"}
            </button>
          </div>
          <p className="mt-3 break-all text-xs text-muted">{scanUrl}</p>
        </section>
      ) : (
        <p className="rounded-xl border border-dashed border-line bg-canvas/60 px-4 py-8 text-center text-sm text-muted">
          No active organization QR code.
        </p>
      )}

      <section className="panel p-6">
        <h2 className="text-sm font-semibold tracking-tight">QR history</h2>
        {codes.length === 0 ? (
          <p className="mt-4 text-sm text-muted">No QR codes have been generated.</p>
        ) : (
          <ul className="mt-4 divide-y divide-line">
            {codes.map((code) => (
              <li
                key={code.id}
                className="flex flex-wrap items-center justify-between gap-3 py-3"
              >
                <div>
                  <p className="text-sm font-medium">
                    Code {code.id}
                    {code.live ? (
                      <span className="status-pill ml-2 bg-mark/10 text-mark">
                        Active
                      </span>
                    ) : code.is_active ? (
                      <span className="status-pill ml-2 bg-red-50 text-red-800">
                        Expired
                      </span>
                    ) : (
                      <span className="status-pill ml-2 bg-stone-200/80 text-muted">
                        Inactive
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted">{code.validUntilLabel}</p>
                </div>
                <form
                  action={async () => {
                    const formData = new FormData();
                    formData.set("id", String(code.id));
                    formData.set("is_active", code.is_active ? "false" : "true");
                    const result = await setQrActive(formData);
                    setMessage(result.error);
                    if (!result.error) {
                      router.refresh();
                    }
                  }}
                >
                  <button type="submit" className="btn-secondary">
                    {code.is_active ? "Deactivate" : "Activate"}
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
