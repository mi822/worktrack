"use client";

import { ALREADY_RECORDED } from "@/lib/presence/messages";
import { PHONE_SCAN_HELP } from "@/lib/presence/phone-scan-help";
import { recordPresenceScan } from "@/lib/presence/presence-actions";
import { Html5Qrcode } from "html5-qrcode";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export function PresenceScanner() {
  const router = useRouter();
  const hostId = "presence-scanner";
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const busyRef = useRef(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [phoneHelp, setPhoneHelp] = useState(false);

  useEffect(() => {
    if (!window.isSecureContext) {
      setPhoneHelp(true);
      return;
    }

    const scanner = new Html5Qrcode(hostId, { verbose: false });
    scannerRef.current = scanner;

    scanner
      .start(
        { facingMode: "environment" },
        { fps: 8, qrbox: { width: 220, height: 220 } },
        async (decoded) => {
          if (busyRef.current) {
            return;
          }
          busyRef.current = true;
          const result = await recordPresenceScan(decoded);
          if (result.recorded || result.alreadyRecorded) {
            await scanner.stop().catch(() => undefined);
            scannerRef.current = null;
            setMessage(
              result.alreadyRecorded
                ? ALREADY_RECORDED
                : "Presence recorded.",
            );
            router.refresh();
            return;
          }
          setError(result.error);
          busyRef.current = false;
        },
        () => undefined,
      )
      .catch(() => {
        setPhoneHelp(true);
      });

    return () => {
      const current = scannerRef.current;
      if (current?.isScanning) {
        void current.stop().catch(() => undefined);
      }
    };
  }, [router]);

  return (
    <div className="panel mt-8 p-6">
      {error ? <p className="alert-error mb-4">{error}</p> : null}
      {message ? (
        <p className="text-sm font-medium text-ink">{message}</p>
      ) : phoneHelp ? (
        <p className="text-sm leading-relaxed text-muted">{PHONE_SCAN_HELP}</p>
      ) : (
        <>
          <p className="text-sm text-muted">
            Point the camera at the organization QR code. Scanning stops after a
            successful record.
          </p>
          <div id={hostId} className="mt-4 overflow-hidden rounded-xl" />
        </>
      )}
    </div>
  );
}
