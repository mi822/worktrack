import { HomeIllustration } from "@/components/dashboard/home-illustration";
import { NavIcon } from "@/components/nav-icon";
import { firstName } from "@/lib/initials";
import Link from "next/link";

export function EmptyNote({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  if (!title) {
    return (
      <p className="rounded-2xl bg-canvas/70 px-4 py-6 text-center text-sm text-muted">
        {children}
      </p>
    );
  }

  return (
    <div className="rounded-2xl bg-canvas/70 px-4 py-6 text-center">
      <p className="text-sm font-semibold text-ink">{title}</p>
      <p className="mt-1 text-sm text-muted">{children}</p>
    </div>
  );
}

type StatTone = "default" | "ok" | "warn" | "bad" | "action" | "violet";

const STAT_BADGE: Record<StatTone, string> = {
  default: "bg-slate-100 text-muted",
  ok: "bg-ok/10 text-ok",
  warn: "bg-warn/10 text-warn",
  bad: "bg-bad/10 text-bad",
  action: "bg-action/10 text-action",
  violet: "bg-violet-100 text-violet-600",
};

const STAT_DOT: Record<StatTone, string> = {
  default: "bg-muted/50",
  ok: "bg-ok",
  warn: "bg-warn",
  bad: "bg-bad",
  action: "bg-action",
  violet: "bg-violet-500",
};

export function Stat({
  label,
  value,
  hint,
  tone = "default",
  icon,
  wide = false,
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: StatTone;
  icon?: string;
  wide?: boolean;
}) {
  return (
    <div className={wide ? "stat-tile col-span-full" : "stat-tile"}>
      <div className="flex items-start gap-3">
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${STAT_BADGE[tone]}`}
          aria-hidden="true"
        >
          {icon ? (
            <NavIcon href={icon} />
          ) : (
            <span className={`h-2.5 w-2.5 rounded-full ${STAT_DOT[tone]}`} />
          )}
        </span>
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted">{label}</p>
          <p className="font-display mt-1 text-2xl font-bold tracking-tight text-ink">
            {value}
          </p>
          {hint ? <p className="mt-0.5 text-xs text-muted">{hint}</p> : null}
        </div>
      </div>
    </div>
  );
}

export function StatGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">{children}</div>;
}

export function DashSection({
  title,
  description,
  icon,
  aside,
  children,
}: {
  title: string;
  description?: string;
  icon: string;
  aside?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="panel mt-6 p-5 sm:p-6">
      <SectionHeader title={title} description={description} icon={icon} aside={aside} />
      {children}
    </section>
  );
}

export function SectionHeader({
  title,
  description,
  icon,
  aside,
}: {
  title: string;
  description?: string;
  icon: string;
  aside?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        <span className="section-icon" aria-hidden="true">
          <NavIcon href={icon} size="lg" />
        </span>
        <div className="min-w-0">
          <h2 className="font-display text-base font-bold tracking-tight text-ink">
            {title}
          </h2>
          {description ? <p className="mt-0.5 text-xs text-muted">{description}</p> : null}
        </div>
      </div>
      {aside}
    </div>
  );
}

export function BackLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink"
    >
      <span className="rotate-180">
        <NavIcon href="arrow-right" />
      </span>
      {children}
    </Link>
  );
}

export function PageHeader({
  icon,
  caption,
  title,
  description,
  actions,
}: {
  icon: string;
  caption?: string;
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex min-w-0 items-center gap-4">
        <span
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-action text-white shadow-[0_8px_20px_rgba(37,99,235,0.25)]"
          aria-hidden="true"
        >
          <NavIcon href={icon} size="lg" />
        </span>
        <div className="min-w-0">
          {caption ? <p className="text-sm font-medium text-muted">{caption}</p> : null}
          <h1 className="page-title break-words">{title}</h1>
          {description ? <p className="mt-1 text-sm text-muted">{description}</p> : null}
        </div>
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
    </div>
  );
}

export function Greeting({
  name,
  caption,
  intro,
}: {
  name: string;
  caption: string;
  intro: string;
}) {
  return (
    <div className="flex items-center justify-between gap-6">
      <div className="min-w-0">
        <p className="text-sm font-medium text-muted">{caption}</p>
        <h1 className="page-title mt-1 truncate">
          Hello, {firstName(name)} <span aria-hidden="true">👋</span>
        </h1>
        <p className="mt-1.5 text-sm text-muted">{intro}</p>
      </div>
      <HomeIllustration className="hidden h-28 w-auto shrink-0 sm:block" />
    </div>
  );
}

const TILE_TONES = [
  "bg-action/10 text-action",
  "bg-orange-100 text-orange-600",
  "bg-emerald-100 text-emerald-700",
  "bg-violet-100 text-violet-700",
  "bg-rose-100 text-rose-600",
] as const;

export function IconTile({ label, seed }: { label: string; seed: number }) {
  const tone = TILE_TONES[Math.abs(seed) % TILE_TONES.length];
  return (
    <span className={`icon-tile ${tone}`} aria-hidden="true">
      {label.trim().charAt(0).toUpperCase() || "?"}
    </span>
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
              className="flex w-full max-w-10 flex-col justify-end overflow-hidden rounded-lg bg-canvas"
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
