import { DeleteProjectForm } from "@/app/projects/delete-project-form";
import { TaskCreateForm } from "@/app/projects/task-create-form";
import { ProjectProgressStats } from "@/app/projects/project-progress";
import { AppShell } from "@/components/app-shell";
import { BackLink, EmptyNote, IconTile, SectionHeader } from "@/components/dashboard/ui";
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
      <div className="flex items-start justify-between gap-3">
        <BackLink href="/projects">Back to projects</BackLink>
        {isManager && project.status !== "closed" ? (
          <Link href={`/projects/${project.id}/edit`} className="btn-secondary h-9 px-4">
            Edit project
          </Link>
        ) : null}
      </div>

      {error ? <p className="alert-error mt-6">{error}</p> : null}
      {saved ? (
        <p className="mt-6 rounded-xl border border-line bg-white px-4 py-3 text-sm text-ink">
          Project saved.
        </p>
      ) : null}
      {submitted ? (
        <p className="mt-6 rounded-xl border border-line bg-white px-4 py-3 text-sm text-ink">
          Project submitted to the manager for closure.
        </p>
      ) : null}
      {closed ? (
        <p className="mt-6 rounded-xl border border-line bg-white px-4 py-3 text-sm text-ink">
          Project closed.
        </p>
      ) : null}

      <section className="hero-card mt-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-white/70">
          {isManager ? "Manager" : "Project head"}
        </p>
        <h1 className="mt-1 font-display text-[1.6rem] font-bold leading-tight tracking-tight sm:text-[1.85rem]">
          {project.title}
        </h1>
        {project.description ? (
          <p className="mt-2 text-sm text-white/80">{project.description}</p>
        ) : null}
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="hero-chip">Start {formatDate(project.start_date)}</span>
          <span className="hero-chip">Budget {project.budget}</span>
          <span className="hero-chip">
            {project.head_name ?? "No project head"}
          </span>
        </div>
        <dl className="mt-6 grid grid-cols-3 gap-2 border-t border-white/15 pt-5 text-center">
          <div>
            <dt className="text-xs text-white/70">Deadline</dt>
            <dd className="mt-1 text-sm font-bold">{formatDate(project.deadline)}</dd>
          </div>
          <div className="border-x border-white/15">
            <dt className="text-xs text-white/70">Approved</dt>
            <dd className="mt-1 text-sm font-bold">
              {project.progress.byStatus.approved}/{project.progress.total}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-white/70">Status</dt>
            <dd className="mt-1 text-sm font-bold">
              {PROJECT_STATUS_LABEL[project.status]}
            </dd>
          </div>
        </dl>
      </section>

      <section className="panel mt-6 p-5 sm:p-6">
        <SectionHeader icon="/performance" title="Progress" description="Tasks by status" />
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
        <section className="panel mt-6 p-5 sm:p-6">
          <SectionHeader
            icon="check"
            title="Submit to manager"
            description="All tasks are approved. Submit this project so the manager can close it."
          />
          <form action={submitProjectForClosure}>
            <input type="hidden" name="id" value={project.id} />
            <button type="submit" className="btn-primary">
              Submit to manager
            </button>
          </form>
        </section>
      ) : null}

      {isAssignedHead && project.status === "pending_closure" ? (
        <p className="mt-6 rounded-xl border border-line bg-white px-4 py-3 text-sm text-ink">
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
        <section className="panel mt-6 p-5 sm:p-6">
          <SectionHeader
            icon="check"
            title="Close project"
            description="The project head submitted this work. Closing terminates the project."
          />
          <form action={closeProject}>
            <input type="hidden" name="id" value={project.id} />
            <button type="submit" className="btn-primary">
              Close project
            </button>
          </form>
        </section>
      ) : null}

      <section className="panel mt-6 p-5 sm:p-6">
        <SectionHeader
          icon="/tasks"
          title="Tasks"
          description={`${tasks.length} ${tasks.length === 1 ? "task" : "tasks"} on this project`}
        />
        {tasks.length === 0 ? (
          <EmptyNote>No tasks yet.</EmptyNote>
        ) : (
          <ul className="card-list">
            {tasks.map((task) => (
              <li key={task.id}>
                <Link
                  href={`/tasks/${task.id}`}
                  className="card-row outline-none focus-visible:ring-2 focus-visible:ring-action/20"
                >
                  <IconTile
                    label={task.assignee_name ?? task.description}
                    seed={task.id}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ink">{task.description}</p>
                    <p className="mt-1 text-sm text-muted">
                      {TASK_STATUS_LABEL[task.status]}
                      {" · "}
                      {TASK_PRIORITY_LABEL[task.priority]}
                      {" · "}
                      {formatDate(task.deadline)}
                      {task.assignee_name ? ` · ${task.assignee_name}` : ""}
                    </p>
                  </div>
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
        <section className="panel mt-6 p-5 sm:p-6">
          <SectionHeader
            icon="plus"
            title="Assign tasks"
            description="Assign as many tasks as you need. Each task goes to one employee or intern."
          />
          <TaskCreateForm projectId={project.id} workers={workers} />
        </section>
      ) : null}

      {isOwningManager ? (
        <section className="panel mt-6 border-bad/20 p-5 sm:p-6">
          <SectionHeader
            icon="alert"
            title="Delete project"
            description="Permanently removes this project with its tasks, submissions, and files."
          />
          <DeleteProjectForm projectId={project.id} title={project.title} />
        </section>
      ) : null}
    </AppShell>
  );
}
