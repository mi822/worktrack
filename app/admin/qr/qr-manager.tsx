"use client";

import { EmptyNote, SectionHeader, StatusPill } from "@/components/dashboard/ui";
import { FormSubmitButton } from "@/components/form-submit-button";
import { NavIcon } from "@/components/nav-icon";
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

      <section className="panel p-5 sm:p-6">
        <SectionHeader
          icon="plus"
          title="New presence QR code"
          description="Generating a new code replaces the current one"
        />
        <form
          className="flex flex-wrap items-end gap-3"
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
        <section className="panel p-5 sm:p-6">
          <SectionHeader
            icon="/admin/qr"
            title="Active presence QR"
            description="People scan this code to record presence"
            aside={<StatusPill tone="ok">Active</StatusPill>}
          />
          <div className="inline-block rounded-2xl border border-line bg-white p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={activeImage}
              alt="Active organization presence QR code"
              className="block h-72 w-72"
            />
          </div>
          <div className="mt-4">
            <Link href="/admin/qr/display" className="btn-primary gap-2">
              Open large view
              <NavIcon href="arrow-right" />
            </Link>
          </div>
        </section>
      ) : (
        <EmptyNote>No active organization presence QR code.</EmptyNote>
      )}

      <section className="panel p-5 sm:p-6">
        <SectionHeader icon="/timesheet" title="QR history" description="Codes generated before" />
        {codes.length === 0 ? (
          <EmptyNote>No QR codes have been generated.</EmptyNote>
        ) : (
          <ul className="card-list">
            {codes.map((code) => (
              <li
                key={code.id}
                className="card-row flex-wrap items-center justify-between"
              >
                <div>
                  <p className="flex items-center gap-2 text-sm font-semibold text-ink">
                    Code {code.id}
                    {code.live ? (
                      <StatusPill tone="ok">Active</StatusPill>
                    ) : code.is_active ? (
                      <StatusPill tone="bad">Expired</StatusPill>
                    ) : (
                      <StatusPill tone="muted">Inactive</StatusPill>
                    )}
                  </p>
                  <p className="mt-0.5 text-xs text-muted">{code.validUntilLabel}</p>
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
