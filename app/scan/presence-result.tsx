import { ALREADY_RECORDED } from "@/lib/presence/messages";

export function PresenceResult({
  alreadyRecorded,
  recordedStatus,
  error,
}: {
  alreadyRecorded?: boolean;
  recordedStatus?: string | null;
  error?: string | null;
}) {
  if (error) {
    return (
      <div className="panel mt-8 p-6">
        <p className="alert-error">{error}</p>
      </div>
    );
  }

  if (alreadyRecorded) {
    return (
      <div className="panel mt-8 px-6 py-10">
        <p className="text-sm font-medium text-ink">{ALREADY_RECORDED}</p>
        {recordedStatus ? (
          <p className="mt-1.5 text-sm capitalize text-muted">
            Status: {recordedStatus}
          </p>
        ) : null}
      </div>
    );
  }

  if (recordedStatus) {
    return (
      <div className="panel mt-8 px-6 py-10">
        <p className="text-sm font-medium text-ink">Presence recorded.</p>
        <p className="mt-1.5 text-sm capitalize text-muted">
          Status: {recordedStatus}
        </p>
      </div>
    );
  }

  return null;
}
