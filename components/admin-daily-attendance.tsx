import { FormSubmitButton } from "@/components/form-submit-button";
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
    <DashSection caption="Today" title="Daily attendance">
      {notice ? (
        <p className="mb-4 rounded-xl border border-ok/20 bg-ok/5 px-3.5 py-2.5 text-sm text-ok">
          {notice}
        </p>
      ) : null}
      <div className="flex flex-wrap items-center gap-3">
        <StatusPill tone={active ? "ok" : "muted"}>
          {active ? "Active" : "Closed"}
        </StatusPill>
        <p className="text-sm text-muted">{formatDate(workDate)}</p>
        {day?.activated_at ? (
          <p className="text-sm text-muted">
            Activated {formatTime(day.activated_at)}
          </p>
        ) : null}
      </div>

      {!presence.hoursConfigured ? (
        <p className="mt-5 text-sm text-muted">{HOURS_UNSET_HINT}</p>
      ) : (
        <StatGrid>
          <Stat label="Total eligible users" value={presence.expected} />
          <Stat label="Present" value={presence.present} tone="ok" />
          <Stat label="Late" value={presence.late} tone="warn" />
          <Stat label="Not recorded" value={presence.absent} tone="bad" />
          <Stat
            label="Attendance rate"
            value={rate ?? "—"}
            tone="action"
          />
        </StatGrid>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-line/60 pt-5">
        {active ? (
          <form action={closeTodaysAttendance}>
            <FormSubmitButton
              pendingLabel="Closing…"
              className="btn-secondary"
            >
              Close attendance
            </FormSubmitButton>
          </form>
        ) : (
          <form action={activateTodaysAttendance}>
            <FormSubmitButton pendingLabel="Opening…">
              Activate today&apos;s attendance
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
