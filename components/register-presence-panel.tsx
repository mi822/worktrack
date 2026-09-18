"use client";

import { PresenceScanner } from "@/app/scan/scanner";
import { useState } from "react";

const NO_ACTIVE_QR =
  "Today's presence QR code has not been generated yet. Please contact the administrator.";

export function RegisterPresencePanel({
  fullName,
  qrImage,
}: {
  fullName: string;
  qrImage: string | null;
}) {
  const [started, setStarted] = useState(false);

  if (!qrImage) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-ink">
          Status: <span className="font-medium">Not Registered</span>
        </p>
        <p className="text-sm text-muted">{NO_ACTIVE_QR}</p>
      </div>
    );
  }

  if (started) {
    return <PresenceScanner fullName={fullName} qrImage={qrImage} />;
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-ink">
        Status: <span className="font-medium">Not Registered</span>
      </p>
      <button
        type="button"
        className="btn-primary"
        onClick={() => setStarted(true)}
      >
        Presence
      </button>
    </div>
  );
}
