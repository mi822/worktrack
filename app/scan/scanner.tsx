"use client";

import { PresenceResult } from "@/app/scan/presence-result";
import { formatDate, formatTime } from "@/lib/format-date";
import { autoRecordActivePresence } from "@/lib/presence/presence-actions";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type ScanOutcome = {
  alreadyRecorded?: boolean;
  recordedStatus?: string | null;
  error?: string | null;
  fullName?: string | null;
  workDate?: string | null;
  scannedAt?: string | null;
};

export function PresenceScanner({
  fullName,
  qrImage,
}: {
  fullName: string;
  qrImage: string;
}) {
  const router = useRouter();
  const busyRef = useRef(false);
  const [scanning, setScanning] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<ScanOutcome | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (busyRef.current) {
      return;
    }
    busyRef.current = true;
    setScanning(true);
    setError(null);

    void (async () => {
      const result = await autoRecordActivePresence();
      if (cancelled) {
        return;
      }

      if (result.recorded || result.alreadyRecorded) {
        setScanning(false);
        setOutcome({
          alreadyRecorded: result.alreadyRecorded,
          recordedStatus: result.status ?? "present",
          fullName: result.fullName ?? fullName,
          workDate: result.workDate ? formatDate(result.workDate) : null,
          scannedAt: result.scannedAt ? formatTime(result.scannedAt) : null,
        });
        router.refresh();
        return;
      }

      setScanning(false);
      setError(result.error);
      busyRef.current = false;
    })();

    return () => {
      cancelled = true;
    };
  }, [fullName, router]);

  if (outcome) {
    return (
      <PresenceResult
        alreadyRecorded={outcome.alreadyRecorded}
        recordedStatus={outcome.recordedStatus}
        fullName={outcome.fullName}
        workDate={outcome.workDate}
        scannedAt={outcome.scannedAt}
      />
    );
  }

  return (
    <div className="panel mt-1 px-5 py-6 text-center">
      <p className="field-caption">Registering presence</p>
      <p className="mt-3 text-sm text-muted">
        {scanning ? "Scanning automatically…" : "Scan finished."}
      </p>

      <div className="relative mx-auto mt-4 w-full max-w-[240px]">
        <div className="relative overflow-hidden rounded-md border border-line bg-white p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrImage}
            alt="Organization presence QR code for today"
            className="block h-full w-full"
          />
          {scanning ? (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-3 overflow-hidden rounded-sm"
            >
              <div className="wt-scan-line" />
            </div>
          ) : null}
        </div>
      </div>

      {scanning ? (
        <p className="mt-3 text-sm text-muted">Please wait…</p>
      ) : null}
      {error ? <p className="alert-error mt-3 text-left">{error}</p> : null}
    </div>
  );
}
