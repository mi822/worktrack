import { ALREADY_RECORDED } from "@/lib/presence/messages";

export function PresenceResult({
  alreadyRecorded,
  recordedStatus,
  error,
  fullName,
  workDate,
  scannedAt,
}: {
  alreadyRecorded?: boolean;
  recordedStatus?: string | null;
  error?: string | null;
  fullName?: string | null;
  workDate?: string | null;
  scannedAt?: string | null;
}) {
  if (error) {
    return (
      <div className="panel mt-1 px-5 py-6">
        <p className="alert-error">{error}</p>
      </div>
    );
  }

  if (alreadyRecorded) {
    return (
      <div className="panel mt-1 px-5 py-6">
        <p className="text-sm font-semibold text-ink">{ALREADY_RECORDED}</p>
        {fullName || workDate || scannedAt || recordedStatus ? (
          <dl className="mt-4 space-y-1.5 text-sm text-muted">
            {fullName ? (
              <div>
                <span className="text-ink">User:</span> {fullName}
              </div>
            ) : null}
            {workDate ? (
              <div>
                <span className="text-ink">Date:</span> {workDate}
              </div>
            ) : null}
            {scannedAt ? (
              <div>
                <span className="text-ink">Time:</span> {scannedAt}
              </div>
            ) : null}
            {recordedStatus ? (
              <div>
                <span className="text-ink">Status:</span>{" "}
                <span className="uppercase">{recordedStatus}</span>
              </div>
            ) : null}
          </dl>
        ) : null}
      </div>
    );
  }

  if (recordedStatus) {
    return (
      <div className="panel mt-1 px-5 py-6 text-center">
        <p className="field-caption">Presence recorded</p>
        <p className="mt-3 text-sm font-semibold text-ok">
          ✓ Successfully registered
        </p>
        <p className="mt-1 text-sm text-ok">
          ✓ Presence recorded successfully
        </p>
        <dl className="mt-4 space-y-1.5 text-left text-sm text-muted">
          {fullName ? (
            <div>
              <span className="text-ink">User:</span> {fullName}
            </div>
          ) : null}
          {workDate ? (
            <div>
              <span className="text-ink">Date:</span> {workDate}
            </div>
          ) : null}
          {scannedAt ? (
            <div>
              <span className="text-ink">Time:</span> {scannedAt}
            </div>
          ) : null}
          <div>
            <span className="text-ink">Status:</span>{" "}
            <span className="uppercase">{recordedStatus}</span>
          </div>
        </dl>
      </div>
    );
  }

  return null;
}
