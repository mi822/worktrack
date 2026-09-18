import { AppShell } from "@/components/app-shell";
import { PageFallback } from "@/components/page-fallback";
import { TaskList } from "@/components/task-list";
import { requireWorker } from "@/lib/auth";
import { listAssignedTasks } from "@/lib/work/queries";
import { Suspense } from "react";

export default async function TasksPage() {
  const profile = await requireWorker();

  return (
    <AppShell profile={profile}>
      <p className="field-caption">
        {profile.role === "intern" ? "Intern" : "Employee"}
      </p>
      <h1 className="page-title mt-1">Tasks</h1>

      <section className="panel mt-8 p-6">
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
