import { AppShell } from "@/components/app-shell";
import { EmptyNote } from "@/components/dashboard/ui";
import { requireProfile } from "@/lib/auth";
import { formatDate, formatTime } from "@/lib/format-date";
import { calendarDateInZone } from "@/lib/logs/work-date";
import { getWorkSchedule } from "@/lib/presence/schedule";
import { ROLE_LABEL } from "@/lib/roles";
import {
  defaultTimesheetRange,
  getMyTimesheet,
  getTeamTimesheets,
} from "@/lib/timesheet/queries";
import Link from "next/link";

export default async function TimesheetPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const profile = await requireProfile();
  const { view: viewRaw } = await searchParams;
  const view = viewRaw === "month" ? "month" : "week";
  const schedule = await getWorkSchedule();
  const today = calendarDateInZone(schedule?.timezone ?? "Africa/Douala");
  const range = defaultTimesheetRange(today, view);
  const isLead =
    profile.role === "admin" ||
    profile.role === "manager" ||
    profile.role === "project_head";
  const people = isLead
    ? await getTeamTimesheets(profile, range.start, range.end)
    : [await getMyTimesheet(profile, range.start, range.end)];

  return (
    <AppShell profile={profile}>
      <p className="field-caption">{ROLE_LABEL[profile.role]}</p>
      <h1 className="page-title mt-1">Timesheet</h1>
      <p className="mt-4 text-sm">
        <Link
          href="/timesheet?view=week"
          className="text-muted underline-offset-2 hover:text-ink hover:underline"
        >
          Week
        </Link>
        <span className="mx-2 text-muted">·</span>
        <Link
          href="/timesheet?view=month"
          className="text-muted underline-offset-2 hover:text-ink hover:underline"
        >
          Month
        </Link>
      </p>

      {!schedule ? (
        <div className="mt-8">
          <EmptyNote title="Hours not configured">
            Admin must set working hours before timesheets can be calculated.
          </EmptyNote>
        </div>
      ) : people.length === 0 ? (
        <div className="mt-8">
          <EmptyNote>No people in scope.</EmptyNote>
        </div>
      ) : (
        people.map((person) => (
          <section key={person.id} className="panel mt-8 overflow-x-auto p-6">
            <h2 className="text-sm font-semibold tracking-tight">
              {person.full_name}
            </h2>
            <p className="mt-1 text-sm text-muted">
              {person.totals.actualHours} h worked of {person.totals.expectedHours} h
              expected
            </p>
            <table className="mt-4 w-full min-w-[32rem] text-left text-sm">
              <thead>
                <tr className="text-muted">
                  <th className="pb-2 font-medium">Date</th>
                  <th className="pb-2 font-medium">Arrival</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium">Hours</th>
                  <th className="pb-2 font-medium">Late (min)</th>
                </tr>
              </thead>
              <tbody>
                {person.days
                  .filter((day) => day.isWorkingDay)
                  .map((day) => (
                    <tr key={day.workDate} className="border-t border-line">
                      <td className="py-2">{formatDate(day.workDate)}</td>
                      <td className="py-2">
                        {day.scannedAt ? formatTime(day.scannedAt) : "—"}
                      </td>
                      <td className="py-2">
                        {day.status === "absent" ? "Absent" : day.status === "late" ? "Late" : "Present"}
                      </td>
                      <td className="py-2">
                        {day.actualHours} / {day.expectedHours}
                      </td>
                      <td className="py-2">{day.lateMinutes}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </section>
        ))
      )}
    </AppShell>
  );
}
