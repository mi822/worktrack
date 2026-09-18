export function EmptyNote({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  if (!title) {
    return (
      <p className="rounded-lg border border-dashed border-line bg-canvas px-4 py-6 text-center text-sm text-muted">
        {children}
      </p>
    );
  }

  return (
    <div className="rounded-lg border border-dashed border-line bg-canvas px-4 py-6 text-center">
      <p className="text-sm font-semibold text-ink">{title}</p>
      <p className="mt-1 text-sm text-muted">{children}</p>
    </div>
  );
}

export function Stat({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "default" | "ok" | "warn" | "bad" | "action";
}) {
  const bar =
    tone === "ok"
      ? "border-l-ok"
      : tone === "warn"
        ? "border-l-warn"
        : tone === "bad"
          ? "border-l-bad"
          : tone === "action"
            ? "border-l-action"
            : "border-l-line";

  return (
    <div className={`stat-tile border-l-[3px] ${bar}`}>
      <p className="field-caption">{label}</p>
      <p className="font-display mt-1.5 text-xl font-semibold tracking-tight text-ink">
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
    </div>
  );
}

export function StatGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-3 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">{children}</div>
  );
}

export function DashSection({
  caption,
  title,
  children,
}: {
  caption: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-6">
      <div className="mb-2.5">
        <p className="field-caption">{caption}</p>
        <h2 className="font-display mt-0.5 text-base font-semibold tracking-tight text-ink">
          {title}
        </h2>
      </div>
      <div className="panel p-4 sm:p-5">{children}</div>
    </section>
  );
}

export function StatusPill({
  tone,
  children,
}: {
  tone: "ok" | "warn" | "bad" | "action" | "muted";
  children: React.ReactNode;
}) {
  const className =
    tone === "ok"
      ? "status-pill-ok"
      : tone === "warn"
        ? "status-pill-warn"
        : tone === "bad"
          ? "status-pill-bad"
          : tone === "action"
            ? "status-pill-action"
            : "status-pill-muted";
  return <span className={className}>{children}</span>;
}

export function ProgressBar({ value, max }: { value: number; max: number }) {
  const safeMax = max <= 0 ? 1 : max;
  const width = Math.min(100, Math.round((value / safeMax) * 100));
  return (
    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line">
      <div className="h-full rounded-full bg-action" style={{ width: `${width}%` }} />
    </div>
  );
}

export function WeekBars({
  days,
}: {
  days: { date: string; label: string; present: number; late: number }[];
}) {
  const peak = Math.max(1, ...days.map((day) => day.present + day.late));

  return (
    <div className="mt-4 flex items-end gap-2">
      {days.map((day) => {
        return (
          <div key={day.date} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
            <div
              className="flex w-full max-w-10 flex-col justify-end overflow-hidden rounded bg-canvas"
              style={{ height: 80 }}
              title={`${day.label}: ${day.present} present, ${day.late} late`}
            >
              <div
                className="w-full bg-warn"
                style={{ height: Math.round((day.late / peak) * 80) }}
              />
              <div
                className="w-full bg-action"
                style={{ height: Math.round((day.present / peak) * 80) }}
              />
            </div>
            <p className="text-[11px] font-medium text-muted">{day.label}</p>
          </div>
        );
      })}
    </div>
  );
}
