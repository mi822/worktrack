import { FormSubmitButton } from "@/components/form-submit-button";
import { NavIcon } from "@/components/nav-icon";
import { DashSection, Stat, StatGrid, StatusPill } from "@/components/dashboard/ui";
import { HOURS_UNSET, HOURS_UNSET_HINT } from "@/lib/dashboards/empty-copy";
import {
  activateTodaysAttendance,
  closeTodaysAttendance,
  getAttendanceDay,
} from "@/lib/presence/attendance-actions";
import { attendanceDayKind } from "@/lib/presence/attendance-pure";
import { formatDate, formatTime } from "@/lib/format-date";
import type { PresenceSnapshot } from "@/lib/dashboards/types";
import { formatPercent } from "@/lib/dashboards/classify";

export async function AdminDailyAttendance({
  workDate,
  presence,
  notice,
}: {
  workDate: string;
  presence: PresenceSnapshot;
  notice?: string | null;
}) {
  const day = await getAttendanceDay(workDate);
  const kind = attendanceDayKind(day);
  const active = kind === "active";
  const rate = formatPercent(presence.attendancePercent);

  return (
    <DashSection
      title="Daily attendance"
      description={
        day?.activated_at
          ? `Overview of today's attendance · opened ${formatTime(day.activated_at)}`
          : "Overview of today's attendance status"
      }
      icon="/attendance"
      aside={
        <div className="flex items-center gap-3">
          <StatusPill tone={active ? "ok" : "muted"}>
            <span
              className={`mr-1.5 h-1.5 w-1.5 rounded-full ${active ? "bg-ok" : "bg-muted"}`}
              aria-hidden="true"
            />
            {active ? "Active" : "Closed"}
          </StatusPill>
          <span className="h-5 w-px bg-line" aria-hidden="true" />
          <span className="flex items-center gap-1.5 text-sm text-ink-soft">
            <span className="text-muted">
              <NavIcon href="/attendance" />
            </span>
            {formatDate(workDate)}
          </span>
        </div>
      }
    >
      {notice ? (
        <p className="mb-4 rounded-xl border border-ok/20 bg-ok/5 px-3.5 py-2.5 text-sm text-ok">
          {notice}
        </p>
      ) : null}

      {!presence.hoursConfigured ? (
        <p className="text-sm text-muted">{HOURS_UNSET_HINT}</p>
      ) : (
        <StatGrid>
          <Stat
            label="Total eligible users"
            value={presence.expected}
            tone="action"
            icon="/admin/users"
          />
          <Stat label="Present" value={presence.present} tone="ok" />
          <Stat label="Late" value={presence.late} tone="warn" />
          <Stat label="Not recorded" value={presence.absent} tone="bad" />
          <Stat
            label="Attendance rate"
            value={rate ?? "—"}
            tone="action"
            icon="percent"
            wide
          />
        </StatGrid>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        {active ? (
          <form action={closeTodaysAttendance}>
            <FormSubmitButton pendingLabel="Closing…" className="btn-secondary gap-2">
              Close attendance
            </FormSubmitButton>
          </form>
        ) : (
          <form action={activateTodaysAttendance}>
            <FormSubmitButton pendingLabel="Opening…" className="btn-primary gap-2.5">
              <NavIcon href="/admin/qr" />
              Activate today&apos;s attendance
              <NavIcon href="arrow-right" />
            </FormSubmitButton>
          </form>
        )}
        {!presence.hoursConfigured ? (
          <p className="text-xs text-muted">{HOURS_UNSET}</p>
        ) : null}
      </div>
    </DashSection>
  );
}
