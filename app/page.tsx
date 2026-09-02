import { AdminDashboard } from "@/components/dashboard/admin-dashboard";
import { HeadDashboard } from "@/components/dashboard/head-dashboard";
import { ManagerDashboard } from "@/components/dashboard/manager-dashboard";
import { WorkerHome } from "@/components/dashboard/worker-home";
import { AppShell } from "@/components/app-shell";
import { requireProfile } from "@/lib/auth";
import {
  getEmployeeDashboard,
  getInternDashboard,
} from "@/lib/dashboards/queries";

export default async function HomePage() {
  const profile = await requireProfile();

  return (
    <AppShell profile={profile}>
      {profile.role === "admin" ? (
        <AdminDashboard />
      ) : profile.role === "manager" ? (
        <ManagerDashboard />
      ) : profile.role === "project_head" ? (
        <HeadDashboard />
      ) : profile.role === "employee" ? (
        <WorkerHome role="employee" data={await getEmployeeDashboard()} />
      ) : (
        <WorkerHome role="intern" data={await getInternDashboard()} />
      )}
    </AppShell>
  );
}
