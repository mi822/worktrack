import { FormSubmitButton } from "@/components/form-submit-button";
import {
  approveTask,
  rejectTask,
  startTask,
  submitTask,
} from "@/lib/work/task-actions";
import type { TaskStatus } from "@/lib/work/types";

export function AssigneeTaskActions({
  taskId,
  status,
}: {
  taskId: number;
  status: TaskStatus;
}) {
  if (status === "assigned" || status === "rejected") {
    return (
      <form action={startTask}>
        <input type="hidden" name="task_id" value={taskId} />
        <FormSubmitButton pendingLabel="Starting…">
          {status === "rejected" ? "Resume work" : "Start task"}
        </FormSubmitButton>
      </form>
    );
  }

  if (status === "in_progress") {
    return (
      <form action={submitTask} className="space-y-4">
        <input type="hidden" name="task_id" value={taskId} />
        <p className="text-sm text-muted">
          When your work is ready, submit it so the project head or manager can
          approve it.
        </p>
        <label className="field-label">
          <span className="field-caption">Submission notes</span>
          <textarea
            name="notes"
            rows={3}
            className="field-input h-auto min-h-20 py-2"
          />
        </label>
        <FormSubmitButton pendingLabel="Submitting…">Submit work</FormSubmitButton>
      </form>
    );
  }

  return null;
}

export function HeadReviewActions({
  taskId,
  status,
}: {
  taskId: number;
  status: TaskStatus;
}) {
  if (status !== "submitted" && status !== "under_review") {
    return null;
  }

  return (
    <div className="space-y-6">
      <form action={approveTask}>
        <input type="hidden" name="task_id" value={taskId} />
        <FormSubmitButton pendingLabel="Approving…">Approve</FormSubmitButton>
      </form>
      <form action={rejectTask} className="space-y-4">
        <input type="hidden" name="task_id" value={taskId} />
        <label className="field-label">
          <span className="field-caption">Rejection reason</span>
          <textarea
            name="reason"
            required
            rows={3}
            className="field-input h-auto min-h-20 py-2"
          />
        </label>
        <FormSubmitButton
          pendingLabel="Rejecting…"
          className="btn-secondary"
        >
          Reject
        </FormSubmitButton>
      </form>
    </div>
  );
}
