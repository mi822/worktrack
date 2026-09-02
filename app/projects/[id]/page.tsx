import { TaskCreateForm } from "@/app/projects/task-create-form";
import { ProjectProgressStats } from "@/app/projects/project-progress";
import { AppShell } from "@/components/app-shell";
import { requireManagerOrHead } from "@/lib/auth";
import { formatDate } from "@/lib/format-date";
import {
  getProject,
  listAssignableWorkers,
  listProjectTasks,
} from "@/lib/work/queries";
import {
  TASK_PRIORITY_LABEL,
  TASK_STATUS_LABEL,
} from "@/lib/work/types";
import { parseIdParam } from "@/lib/work/parse";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function ProjectDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const profile = await requireManagerOrHead();
  const { id: rawId } = await params;
  const id = parseIdParam(rawId);
  if (!id) {
    notFound();
  }

  const project = await getProject(id);
  if (!project) {
    notFound();
  }

  const [tasks, workers, query] = await Promise.all([
    listProjectTasks(id),
    profile.role === "project_head" ? listAssignableWorkers() : Promise.resolve([]),
    searchParams,
  ]);
  const error = query.error?.trim() ? query.error : null;
  const saved = query.saved === "1";
  const isManager = profile.role === "manager";
  const isHead = profile.role === "project_head";

  return (
    <AppShell profile={profile}>
      <p className="field-caption">{isManager ? "Manager" : "Project head"}</p>
      <h1 className="page-title mt-1">{project.title}</h1>
      <p className="page-lede">{project.description}</p>
      <p className="mt-4 text-sm">
        <Link href="/projects" className="text-muted underline-offset-2 hover:text-ink hover:underline">
          Back to projects
        </Link>
        {isManager ? (
          <>
            <span className="mx-2 text-muted">·</span>
            <Link
              href={`/projects/${project.id}/edit`}
              className="text-muted underline-offset-2 hover:text-ink hover:underline"
            >
              Edit
            </Link>
          </>
        ) : null}
      </p>

      {error ? <p className="alert-error mt-6">{error}</p> : null}
      {saved ? (
        <p className="mt-6 rounded-lg border border-line bg-canvas px-3 py-2 text-sm text-ink">
          Project saved.
        </p>
      ) : null}

      <section className="panel mt-8 grid gap-4 p-6 text-sm min-[480px]:grid-cols-2">
        <p>
          <span className="field-caption block">Start</span>
          {formatDate(project.start_date)}
        </p>
        <p>
          <span className="field-caption block">Deadline</span>
          {formatDate(project.deadline)}
        </p>
        <p>
          <span className="field-caption block">Budget</span>
          {project.budget}
        </p>
        <p>
          <span className="field-caption block">Project head</span>
          {project.head_name ?? "Not assigned"}
        </p>
        <ProjectProgressStats progress={project.progress} />
      </section>

      <section className="panel mt-6 p-6">
        <h2 className="text-sm font-semibold tracking-tight">Tasks</h2>
        {tasks.length === 0 ? (
          <p className="mt-4 rounded-xl border border-dashed border-line bg-canvas/60 px-4 py-8 text-center text-sm text-muted">
            No tasks yet.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-line">
            {tasks.map((task) => (
              <li key={task.id} className="py-3 first:pt-0 last:pb-0">
                <Link
                  href={`/tasks/${task.id}`}
                  className="block rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-mark/20"
                >
                  <p className="text-sm font-medium text-ink">{task.description}</p>
                  <p className="mt-1 text-sm text-muted">
                    {TASK_STATUS_LABEL[task.status]}
                    {" · "}
                    {TASK_PRIORITY_LABEL[task.priority]}
                    {" · "}
                    {formatDate(task.deadline)}
                    {task.assignee_name ? ` · ${task.assignee_name}` : ""}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {isHead ? (
        <section className="panel mt-6 p-6">
          <h2 className="text-sm font-semibold tracking-tight">Assign a task</h2>
          <p className="mt-1 text-sm text-muted">
            One employee or intern per task, on this project only.
          </p>
          <TaskCreateForm projectId={project.id} workers={workers} />
        </section>
      ) : null}
    </AppShell>
  );
}
