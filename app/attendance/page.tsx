import { AppShell } from "@/components/app-shell";
import { EmptyNote, StatusPill } from "@/components/dashboard/ui";
import { EMPTY_ATTENDANCE, EMPTY_ATTENDANCE_HINT } from "@/lib/dashboards/empty-copy";
import { requireProfile } from "@/lib/auth";
import { formatDate, formatTime } from "@/lib/format-date";
import { listMyPresenceHistory } from "@/lib/presence/attendance-actions";
import { canRecordAttendance } from "@/lib/presence/attendance-pure";
import { ROLE_LABEL } from "@/lib/roles";
import { redirect } from "next/navigation";

export default async function MyAttendancePage() {
  const profile = await requireProfile();
  if (profile.role === "admin") {
    redirect("/admin/attendance");
  }
  if (!canRecordAttendance(profile.role)) {
    redirect("/");
  }

  const rows = await listMyPresenceHistory();

  return (
    <AppShell profile={profile}>
      <p className="field-caption">{ROLE_LABEL[profile.role]}</p>
      <h1 className="page-title mt-1">My attendance</h1>
      <section className="panel mt-8 p-6">
        {rows.length === 0 ? (
          <EmptyNote title={EMPTY_ATTENDANCE}>{EMPTY_ATTENDANCE_HINT}</EmptyNote>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="pb-3 pr-4 font-medium">Date</th>
                  <th className="pb-3 pr-4 font-medium">Time</th>
                  <th className="pb-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((row) => (
                  <tr key={`${row.work_date}-${row.scanned_at}`}>
                    <td className="py-3 pr-4">{formatDate(row.work_date)}</td>
                    <td className="py-3 pr-4">{formatTime(row.scanned_at)}</td>
                    <td className="py-3">
                      <StatusPill tone={row.status === "present" ? "ok" : "warn"}>
                        {row.status === "present" ? "Present" : "Late"}
                      </StatusPill>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </AppShell>
  );
}
