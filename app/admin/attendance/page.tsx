import { AttendanceTable } from "@/components/attendance-table";
import { AppShell } from "@/components/app-shell";
import { PageHeader, SectionHeader } from "@/components/dashboard/ui";
import { PageFallback } from "@/components/page-fallback";
import { requireAdmin } from "@/lib/auth";
import { listPresenceRecords } from "@/lib/presence/attendance-actions";
import { Suspense } from "react";

export default async function AdminAttendancePage() {
  const profile = await requireAdmin();

  return (
    <AppShell profile={profile}>
      <PageHeader
        icon="/attendance"
        caption="Admin"
        title="Attendance"
        description="Every presence record, newest first"
      />
      <section className="panel mt-6 p-5 sm:p-6">
        <SectionHeader icon="/attendance" title="Presence records" />
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
