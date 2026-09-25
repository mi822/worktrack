import { AppShell } from "@/components/app-shell";
import { PageHeader, SectionHeader } from "@/components/dashboard/ui";
import { PageFallback } from "@/components/page-fallback";
import { TaskList } from "@/components/task-list";
import { requireWorker } from "@/lib/auth";
import { listAssignedTasks } from "@/lib/work/queries";
import { Suspense } from "react";

export default async function TasksPage() {
  const profile = await requireWorker();

  return (
    <AppShell profile={profile}>
      <PageHeader
        icon="/tasks"
        caption={profile.role === "intern" ? "Intern" : "Employee"}
        title="Tasks"
        description="Everything assigned to you"
      />

      <section className="panel mt-6 p-5 sm:p-6">
        <SectionHeader icon="/tasks" title="Your tasks" description="Open a task to start or submit work" />
        <Suspense fallback={<PageFallback />}>
          <AssignedTasks userId={profile.id} />
        </Suspense>
      </section>
    </AppShell>
  );
}

async function AssignedTasks({ userId }: { userId: string }) {
  const tasks = await listAssignedTasks(userId);
  return <TaskList tasks={tasks} />;
}
