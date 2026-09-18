import { TaskCreateForm } from "@/app/projects/task-create-form";
import { ProjectProgressStats } from "@/app/projects/project-progress";
import { AppShell } from "@/components/app-shell";
import { DocumentPanel } from "@/components/documents/document-panel";
import { requireManagerOrHead } from "@/lib/auth";
import { listProjectDocuments } from "@/lib/documents/queries";
import { formatDate } from "@/lib/format-date";
import {
  closeProject,
  submitProjectForClosure,
} from "@/lib/work/project-actions";
import {
  getProject,
  listAssignableWorkers,
  listProjectTasks,
} from "@/lib/work/queries";
import {
  PROJECT_STATUS_LABEL,
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
  searchParams: Promise<{
    error?: string;
    saved?: string;
    submitted?: string;
    closed?: string;
  }>;
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

  const [tasks, workers, documents, query] = await Promise.all([
    listProjectTasks(id),
    profile.role === "project_head" ? listAssignableWorkers() : Promise.resolve([]),
    listProjectDocuments(id),
    searchParams,
  ]);
  const error = query.error?.trim() ? query.error : null;
  const saved = query.saved === "1";
  const submitted = query.submitted === "1";
  const closed = query.closed === "1";
  const isManager = profile.role === "manager";
  const isHead = profile.role === "project_head";
  const isAssignedHead =
    isHead && project.project_head_id === profile.id;
  const isOwningManager = isManager && project.manager_id === profile.id;
  const allTasksApproved =
    tasks.length > 0 && tasks.every((task) => task.status === "approved");
  const canSubmitForClosure =
    isAssignedHead && project.status === "active" && allTasksApproved;
  const canClose =
    isOwningManager && project.status === "pending_closure";

  return (
    <AppShell profile={profile}>
      <p className="field-caption">{isManager ? "Manager" : "Project head"}</p>
      <h1 className="page-title mt-1">{project.title}</h1>
      <p className="mt-2 text-sm text-muted">{project.description}</p>
      <p className="mt-4 text-sm">
        <Link href="/projects" className="text-muted underline-offset-2 hover:text-ink hover:underline">
          Back to projects
        </Link>
        {isManager && project.status !== "closed" ? (
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
      {submitted ? (
        <p className="mt-6 rounded-lg border border-line bg-canvas px-3 py-2 text-sm text-ink">
          Project submitted to the manager for closure.
        </p>
      ) : null}
      {closed ? (
        <p className="mt-6 rounded-lg border border-line bg-canvas px-3 py-2 text-sm text-ink">
          Project closed.
        </p>
      ) : null}

      <section className="panel mt-8 grid gap-4 p-6 text-sm min-[480px]:grid-cols-2">
        <p>
          <span className="field-caption block">Status</span>
          {PROJECT_STATUS_LABEL[project.status]}
        </p>
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

      {isAssignedHead && project.status === "active" && !allTasksApproved ? (
        <p className="mt-6 text-sm text-muted">
          Assign tasks to employees and interns. When they submit work, approve
          or reject each task. Once every task is approved, submit the project
          to the manager.
        </p>
      ) : null}

      {canSubmitForClosure ? (
        <section className="panel mt-6 p-6">
          <h2 className="text-sm font-semibold tracking-tight">
            Submit to manager
          </h2>
          <p className="mt-1 text-sm text-muted">
            All tasks are approved. Submit this project so the manager can close
            it.
          </p>
          <form action={submitProjectForClosure} className="mt-4">
            <input type="hidden" name="id" value={project.id} />
            <button type="submit" className="btn-primary">
              Submit to manager
            </button>
          </form>
        </section>
      ) : null}

      {isAssignedHead && project.status === "pending_closure" ? (
        <p className="mt-6 rounded-lg border border-line bg-canvas px-3 py-2 text-sm text-ink">
          Submitted to the manager. Waiting for them to close this project.
        </p>
      ) : null}

      {isOwningManager && project.status === "active" ? (
        <p className="mt-6 text-sm text-muted">
          You can close this project after the project head approves every task
          and submits it to you.
        </p>
      ) : null}

      {canClose ? (
        <section className="panel mt-6 p-6">
          <h2 className="text-sm font-semibold tracking-tight">
            Close project
          </h2>
          <p className="mt-1 text-sm text-muted">
            The project head submitted this work. Closing terminates the
            project.
          </p>
          <form action={closeProject} className="mt-4">
            <input type="hidden" name="id" value={project.id} />
            <button type="submit" className="btn-primary">
              Close project
            </button>
          </form>
        </section>
      ) : null}

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
                  className="block rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-action/20"
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

      <DocumentPanel
        documents={documents}
        projectId={project.id}
        returnTo={`/projects/${project.id}`}
        canUpload={
          (isManager || isHead) && project.status !== "closed"
        }
      />

      {isHead && project.status === "active" ? (
        <section className="panel mt-6 p-6">
          <h2 className="text-sm font-semibold tracking-tight">
            Assign tasks
          </h2>
          <p className="mt-1 text-sm text-muted">
            Assign as many tasks as you need. Each task goes to one employee or
            intern.
          </p>
          <TaskCreateForm projectId={project.id} workers={workers} />
        </section>
      ) : null}
    </AppShell>
  );
}
