import { AppShell } from "@/components/app-shell";
import { requireAdmin } from "@/lib/auth";
import { formatTime } from "@/lib/format-date";
import { listPresenceRecords } from "@/lib/presence/presence-actions";

export default async function AdminAttendancePage() {
  const profile = await requireAdmin();
  const records = await listPresenceRecords();

  return (
    <AppShell profile={profile}>
      <p className="field-caption">Admin</p>
      <h1 className="page-title mt-1">Attendance</h1>
      <p className="page-lede">
        Rows appear only after a real QR scan. Nothing here is sample data.
      </p>
      <section className="panel mt-8 p-6">
        {records.length === 0 ? (
          <p className="rounded-xl border border-dashed border-line bg-canvas/60 px-4 py-8 text-center text-sm text-muted">
            No attendance records available.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="pb-3 pr-4 font-medium">Person</th>
                  <th className="pb-3 pr-4 font-medium">Date</th>
                  <th className="pb-3 pr-4 font-medium">Time</th>
                  <th className="pb-3 pr-4 font-medium">Status</th>
                  <th className="pb-3 font-medium">QR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {records.map((row) => (
                  <tr key={row.id}>
                    <td className="py-3 pr-4 font-medium">{row.full_name}</td>
                    <td className="py-3 pr-4">{row.work_date}</td>
                    <td className="py-3 pr-4">
                      {formatTime(row.scanned_at)}
                    </td>
                    <td className="py-3 pr-4 capitalize">{row.status}</td>
                    <td className="py-3">{row.qr_code_id}</td>
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
