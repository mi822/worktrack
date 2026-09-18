import { AttendanceTable } from "@/components/attendance-table";
import { AppShell } from "@/components/app-shell";
import { PageFallback } from "@/components/page-fallback";
import { requireAdmin } from "@/lib/auth";
import { listPresenceRecords } from "@/lib/presence/attendance-actions";
import { Suspense } from "react";

export default async function AdminAttendancePage() {
  const profile = await requireAdmin();

  return (
    <AppShell profile={profile}>
      <p className="field-caption">Admin</p>
      <h1 className="page-title mt-1">Attendance</h1>
      <section className="panel mt-8 p-6">
        <Suspense fallback={<PageFallback />}>
          <AttendanceBody />
        </Suspense>
      </section>
    </AppShell>
  );
}

async function AttendanceBody() {
  const records = await listPresenceRecords();
  return <AttendanceTable records={records} />;
}
