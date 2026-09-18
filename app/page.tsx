import { AdminDashboard } from "@/components/dashboard/admin-dashboard";
import { HeadDashboard } from "@/components/dashboard/head-dashboard";
import { ManagerDashboard } from "@/components/dashboard/manager-dashboard";
import { WorkerHome } from "@/components/dashboard/worker-home";
import { AppShell } from "@/components/app-shell";
import { PageFallback } from "@/components/page-fallback";
import { requireProfile } from "@/lib/auth";
import {
  getEmployeeDashboard,
  getInternDashboard,
} from "@/lib/dashboards/queries";
import { ensureReminderNotifications } from "@/lib/notifications/reminders";
import { after } from "next/server";
import { Suspense } from "react";

async function EmployeeHome({ notice }: { notice?: string | null }) {
  return (
    <WorkerHome
      role="employee"
      data={await getEmployeeDashboard()}
      notice={notice}
    />
  );
}

async function InternHome({ notice }: { notice?: string | null }) {
  return (
    <WorkerHome
      role="intern"
      data={await getInternDashboard()}
      notice={notice}
    />
  );
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ attendance?: string; presence?: string }>;
}) {
  const profile = await requireProfile();
  const params = await searchParams;
  const notice = params.attendance ?? params.presence ?? null;

  after(() => {
    void ensureReminderNotifications();
  });

  return (
    <AppShell profile={profile}>
      <Suspense fallback={<PageFallback />}>
        {profile.role === "admin" ? (
          <AdminDashboard notice={notice} />
        ) : profile.role === "manager" ? (
          <ManagerDashboard notice={notice} />
        ) : profile.role === "project_head" ? (
          <HeadDashboard notice={notice} />
        ) : profile.role === "employee" ? (
          <EmployeeHome notice={notice} />
        ) : (
          <InternHome notice={notice} />
        )}
      </Suspense>
    </AppShell>
  );
}
