"use client";

import { FormSubmitButton } from "@/components/form-submit-button";
import { generateAndActivateQr, setQrActive } from "@/lib/presence/qr-actions";
import type { QrCodeRow } from "@/lib/presence/types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type QrCodeListItem = QrCodeRow & { validUntilLabel: string; live: boolean };

export function QrManager({
  codes,
  activeImage,
}: {
  codes: QrCodeListItem[];
  activeImage: string | null;
  scanUrl: string | null;
}) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);

  return (
    <div className="mt-6 space-y-6">
      {message ? <p className="alert-error">{message}</p> : null}

      <section className="panel p-5">
        <h2 className="text-sm font-semibold tracking-tight text-ink">
          Presence QR code
        </h2>
        <form
          className="mt-4 flex flex-wrap items-end gap-3"
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
          <FormSubmitButton pendingLabel="Generating…">
            Generate Today&apos;s Presence QR
          </FormSubmitButton>
        </form>
      </section>

      {activeImage ? (
        <section className="panel p-5">
          <h2 className="text-sm font-semibold tracking-tight text-ink">
            Active presence QR
          </h2>
          <div className="mt-4 inline-block border border-line bg-white p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={activeImage}
              alt="Active organization presence QR code"
              className="block h-72 w-72"
            />
          </div>
          <div className="mt-4">
            <Link href="/admin/qr/display" className="btn-primary">
              Open large view
            </Link>
          </div>
        </section>
      ) : (
        <p className="rounded-lg border border-dashed border-line bg-white px-4 py-6 text-center text-sm text-muted">
          No active organization presence QR code.
        </p>
      )}

      <section className="panel p-5">
        <h2 className="text-sm font-semibold tracking-tight text-ink">
          QR history
        </h2>
        {codes.length === 0 ? (
          <p className="mt-3 text-sm text-muted">No QR codes have been generated.</p>
        ) : (
          <ul className="mt-3 divide-y divide-line">
            {codes.map((code) => (
              <li
                key={code.id}
                className="flex flex-wrap items-center justify-between gap-3 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-ink">
                    Code {code.id}
                    {code.live ? (
                      <span className="status-pill-ok ml-2">Active</span>
                    ) : code.is_active ? (
                      <span className="status-pill ml-2 bg-red-50 text-red-800">
                        Expired
                      </span>
                    ) : (
                      <span className="status-pill ml-2 bg-stone-100 text-muted">
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
