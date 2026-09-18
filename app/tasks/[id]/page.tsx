import {
  AssigneeTaskActions,
  HeadReviewActions,
} from "@/app/tasks/task-actions";
import { AppShell } from "@/components/app-shell";
import { DocumentPanel } from "@/components/documents/document-panel";
import { StatusPill } from "@/components/dashboard/ui";
import { requireTaskAccess } from "@/lib/auth";
import { listProjectDocuments } from "@/lib/documents/queries";
import { formatDate, formatDateTime } from "@/lib/format-date";
import {
  DEADLINE_STATE_LABEL,
  deadlineState,
  type DeadlineState,
} from "@/lib/work/deadline";
import { parseIdParam } from "@/lib/work/parse";
import {
  getTask,
  listTaskFeedback,
  listTaskSubmissions,
} from "@/lib/work/queries";
import { TASK_PRIORITY_LABEL, TASK_STATUS_LABEL } from "@/lib/work/types";
import Link from "next/link";
import { notFound } from "next/navigation";

function deadlineTone(state: DeadlineState) {
  if (state === "completed" || state === "on_time") {
    return "ok" as const;
  }
  if (state === "due_soon") {
    return "warn" as const;
  }
  return "bad" as const;
}

export default async function TaskDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const profile = await requireTaskAccess();
  const { id: rawId } = await params;
  const id = parseIdParam(rawId);
  if (!id) {
    notFound();
  }

  const task = await getTask(id);
  if (!task) {
    notFound();
  }

  const [submissions, feedback, documents, query] = await Promise.all([
    listTaskSubmissions(id),
    listTaskFeedback(id),
    listProjectDocuments(task.project_id, id),
    searchParams,
  ]);
  const error = query.error?.trim() ? query.error : null;
  const isAssignee = task.assignee_id === profile.id;
  const isHead = profile.role === "project_head";
  const isManager = profile.role === "manager";
  const canReview = isHead || isManager;
  const backHref =
    isHead || isManager ? `/projects/${task.project_id}` : "/tasks";
  const today = new Date().toISOString().slice(0, 10);
  const due = deadlineState(task.deadline, task.status, today);

  return (
    <AppShell profile={profile}>
      <p className="field-caption">
        {isHead ? "Project head" : isManager ? "Manager" : "Task"}
      </p>
      <h1 className="page-title mt-1">{task.description}</h1>
      <p className="mt-2 flex flex-wrap items-center gap-2">
        <StatusPill tone="muted">{TASK_STATUS_LABEL[task.status]}</StatusPill>
        <StatusPill tone={deadlineTone(due)}>
          {DEADLINE_STATE_LABEL[due]}
        </StatusPill>
        <span className="text-sm text-muted">
          {TASK_PRIORITY_LABEL[task.priority]} · due {formatDate(task.deadline)}
        </span>
      </p>
      <p className="mt-4 text-sm">
        <Link
          href={backHref}
          className="text-muted underline-offset-2 hover:text-ink hover:underline"
        >
          {isHead || isManager ? "Back to project" : "Back to tasks"}
        </Link>
      </p>

      {error ? <p className="alert-error mt-6">{error}</p> : null}

      <section className="panel mt-8 grid gap-4 p-6 text-sm min-[480px]:grid-cols-2">
        <p>
          <span className="field-caption block">Project</span>
          {task.project_title ?? "—"}
        </p>
        <p>
          <span className="field-caption block">Assignee</span>
          {task.assignee_name ?? "—"}
        </p>
      </section>

      {isAssignee ? (
        <section className="panel mt-6 p-6">
          <h2 className="text-sm font-semibold tracking-tight">Your work</h2>
          <div className="mt-4">
            <AssigneeTaskActions taskId={task.id} status={task.status} />
            {task.status === "submitted" ? (
              <p className="text-sm text-muted">Waiting for review.</p>
            ) : null}
            {task.status === "under_review" ? (
              <p className="text-sm text-muted">Under review.</p>
            ) : null}
            {task.status === "rejected" ? (
              <p className="mt-3 text-sm text-muted">
                This task was rejected. Read the feedback below, then resume and
                submit again.
              </p>
            ) : null}
            {task.status === "approved" ? (
              <p className="text-sm text-muted">This task is approved.</p>
            ) : null}
          </div>
        </section>
      ) : null}

      {canReview ? (
        <section className="panel mt-6 p-6">
          <h2 className="text-sm font-semibold tracking-tight">Review</h2>
          <div className="mt-4">
            <HeadReviewActions taskId={task.id} status={task.status} />
            {task.status === "assigned" ? (
              <p className="text-sm text-muted">
                Waiting for the assignee to start the task.
              </p>
            ) : null}
            {task.status === "in_progress" ? (
              <p className="text-sm text-muted">
                Waiting for the assignee to submit their work. Approval is
                available after they click Submit work.
              </p>
            ) : null}
            {task.status === "rejected" ? (
              <p className="text-sm font-medium text-ink">
                Rejected. The assignee must fix the work and submit again.
              </p>
            ) : null}
            {task.status === "approved" ? (
              <p className="text-sm text-muted">This task is already approved.</p>
            ) : null}
          </div>
        </section>
      ) : null}

      {feedback.length > 0 ? (
        <section className="panel mt-6 p-6">
          <h2 className="text-sm font-semibold tracking-tight">Feedback</h2>
          <ul className="mt-4 space-y-3 text-sm">
            {feedback.map((item) => (
              <li key={item.id}>
                <p className="text-ink">{item.reason}</p>
                <p className="mt-1 text-muted">{formatDateTime(item.created_at)}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <DocumentPanel
        documents={documents}
        projectId={task.project_id}
        taskId={task.id}
        returnTo={`/tasks/${task.id}`}
        canUpload={isAssignee || canReview}
      />

      {submissions.length > 0 ? (
        <section className="panel mt-6 p-6">
          <h2 className="text-sm font-semibold tracking-tight">Submissions</h2>
          <ul className="mt-4 space-y-3 text-sm">
            {submissions.map((item) => (
              <li key={item.id}>
                <p className="text-ink">
                  {item.notes.trim() ? item.notes : "Submitted with no notes."}
                </p>
                <p className="mt-1 text-muted">{formatDateTime(item.created_at)}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </AppShell>
  );
}
