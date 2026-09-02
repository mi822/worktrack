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
  if (status === "pending") {
    return (
      <form action={startTask}>
        <input type="hidden" name="task_id" value={taskId} />
        <FormSubmitButton pendingLabel="Starting…">Start task</FormSubmitButton>
      </form>
    );
  }

  if (status === "in_progress" || status === "rejected") {
    return (
      <form action={submitTask} className="space-y-4">
        <input type="hidden" name="task_id" value={taskId} />
        <label className="field-label">
          <span className="field-caption">
            {status === "rejected" ? "Resubmission notes" : "Submission notes"}
          </span>
          <textarea
            name="notes"
            rows={3}
            className="field-input h-auto min-h-20 py-2"
          />
        </label>
        <FormSubmitButton pendingLabel="Submitting…">
          {status === "rejected" ? "Resubmit" : "Submit work"}
        </FormSubmitButton>
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
  if (status !== "submitted" && status !== "resubmitted") {
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
