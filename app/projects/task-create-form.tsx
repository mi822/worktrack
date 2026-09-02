import { FormSubmitButton } from "@/components/form-submit-button";
import { createTask } from "@/lib/work/task-actions";
import { TASK_PRIORITIES, TASK_PRIORITY_LABEL, type NamedProfile } from "@/lib/work/types";

export function TaskCreateForm({
  projectId,
  workers,
}: {
  projectId: number;
  workers: NamedProfile[];
}) {
  return (
    <form action={createTask} className="mt-6 space-y-5">
      <input type="hidden" name="project_id" value={projectId} />
      {workers.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line bg-canvas/60 px-4 py-3 text-sm text-muted">
          No employee or intern accounts available.
        </p>
      ) : null}
      <label className="field-label">
        <span className="field-caption">Description</span>
        <textarea
          name="description"
          required
          rows={3}
          className="field-input h-auto min-h-20 py-2"
        />
      </label>
      <div className="grid gap-4 min-[480px]:grid-cols-2">
        <label className="field-label">
          <span className="field-caption">Priority</span>
          <select
            name="priority"
            required
            defaultValue="medium"
            className="field-input"
          >
            {TASK_PRIORITIES.map((priority) => (
              <option key={priority} value={priority}>
                {TASK_PRIORITY_LABEL[priority]}
              </option>
            ))}
          </select>
        </label>
        <label className="field-label">
          <span className="field-caption">Deadline</span>
          <input
            type="date"
            name="deadline"
            required
            className="field-input"
          />
        </label>
        <label className="field-label min-[480px]:col-span-2">
          <span className="field-caption">Assignee</span>
          <select
            name="assignee_id"
            required
            defaultValue=""
            className="field-input"
            disabled={workers.length === 0}
          >
            <option value="" disabled>
              Select an employee or intern
            </option>
            {workers.map((person) => (
              <option key={person.id} value={person.id}>
                {person.full_name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <FormSubmitButton pendingLabel="Creating…" className="btn-primary">
        Assign task
      </FormSubmitButton>
    </form>
  );
}
