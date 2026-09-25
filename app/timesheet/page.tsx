import { AppShell } from "@/components/app-shell";
import { EmptyNote, PageHeader, SectionHeader } from "@/components/dashboard/ui";
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
      <PageHeader
        icon="/timesheet"
        caption={ROLE_LABEL[profile.role]}
        title="Timesheet"
        description={`${formatDate(range.start)} – ${formatDate(range.end)}`}
        actions={
          <div className="flex rounded-full border border-line bg-white p-1 text-sm font-semibold">
            <Link
              href="/timesheet?view=week"
              className={
                view === "week"
                  ? "rounded-full bg-action px-4 py-1.5 text-white"
                  : "rounded-full px-4 py-1.5 text-muted hover:text-ink"
              }
            >
              Week
            </Link>
            <Link
              href="/timesheet?view=month"
              className={
                view === "month"
                  ? "rounded-full bg-action px-4 py-1.5 text-white"
                  : "rounded-full px-4 py-1.5 text-muted hover:text-ink"
              }
            >
              Month
            </Link>
          </div>
        }
      />

      {!schedule ? (
        <div className="mt-6">
          <EmptyNote title="Hours not configured">
            Admin must set working hours before timesheets can be calculated.
          </EmptyNote>
        </div>
      ) : people.length === 0 ? (
        <div className="mt-6">
          <EmptyNote>No people in scope.</EmptyNote>
        </div>
      ) : (
        people.map((person) => (
          <section key={person.id} className="panel mt-6 overflow-x-auto p-5 sm:p-6">
            <SectionHeader
              icon="user"
              title={person.full_name}
              description={`${person.totals.actualHours} h worked of ${person.totals.expectedHours} h expected`}
            />
            <table className="w-full min-w-[32rem] text-left text-sm">
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
