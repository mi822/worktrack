import { AppShell } from "@/components/app-shell";
import { requireWorker } from "@/lib/auth";
import { formatDate } from "@/lib/format-date";
import { listAssignedTasks } from "@/lib/work/queries";
import { TASK_PRIORITY_LABEL, TASK_STATUS_LABEL } from "@/lib/work/types";
import Link from "next/link";

export default async function TasksPage() {
  const profile = await requireWorker();
  const tasks = await listAssignedTasks(profile.id);

  return (
    <AppShell profile={profile}>
      <p className="field-caption">
        {profile.role === "intern" ? "Intern" : "Employee"}
      </p>
      <h1 className="page-title mt-1">Tasks</h1>
      <p className="page-lede">
        Only tasks assigned to you appear here. Nothing is sample data.
      </p>

      <section className="panel mt-8 p-6">
        {tasks.length === 0 ? (
          <p className="rounded-xl border border-dashed border-line bg-canvas/60 px-4 py-8 text-center text-sm text-muted">
            No tasks assigned.
          </p>
        ) : (
          <ul className="divide-y divide-line">
            {tasks.map((task) => (
              <li key={task.id} className="py-4 first:pt-0 last:pb-0">
                <Link
                  href={`/tasks/${task.id}`}
                  className="block rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-mark/20"
                >
                  <p className="text-sm font-semibold text-ink">
                    {task.description}
                  </p>
                  <p className="mt-1 text-sm text-muted">
                    {TASK_STATUS_LABEL[task.status]}
                    {" · "}
                    {TASK_PRIORITY_LABEL[task.priority]}
                    {" · "}
                    {formatDate(task.deadline)}
                    {task.project_title ? ` · ${task.project_title}` : ""}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </AppShell>
  );
}
