import { SectionHeader } from "@/components/dashboard/ui";
import { FormSubmitButton } from "@/components/form-submit-button";
import {
  createProject,
  updateProject,
} from "@/lib/work/project-actions";
import type { NamedProfile, ProjectRecord } from "@/lib/work/types";

export function ProjectForm({
  project,
  heads,
  error,
}: {
  project?: ProjectRecord;
  heads: NamedProfile[];
  error: string | null;
}) {
  const action = project ? updateProject : createProject;

  return (
    <form action={action} className="panel mt-6 space-y-6 p-5 sm:p-6">
      <SectionHeader
        icon="/projects"
        title="Project details"
        description="Title, dates, budget and project head"
      />
      {error ? <p className="alert-error">{error}</p> : null}
      {project ? <input type="hidden" name="id" value={project.id} /> : null}

      {heads.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line bg-canvas/60 px-4 py-3 text-sm text-muted">
          No project-head accounts available.
        </p>
      ) : null}

      <label className="field-label">
        <span className="field-caption">Title</span>
        <input
          name="title"
          required
          defaultValue={project?.title}
          className="field-input"
        />
      </label>
      <label className="field-label">
        <span className="field-caption">Description</span>
        <textarea
          name="description"
          required
          rows={4}
          defaultValue={project?.description}
          className="field-input h-auto min-h-24 py-2"
        />
      </label>
      <div className="grid gap-4 min-[480px]:grid-cols-2">
        <label className="field-label">
          <span className="field-caption">Start date</span>
          <input
            type="date"
            name="start_date"
            required
            defaultValue={project?.start_date}
            className="field-input"
          />
        </label>
        <label className="field-label">
          <span className="field-caption">Deadline</span>
          <input
            type="date"
            name="deadline"
            required
            defaultValue={project?.deadline}
            className="field-input"
          />
        </label>
        <label className="field-label">
          <span className="field-caption">Budget</span>
          <input
            type="number"
            name="budget"
            required
            min={0}
            step="0.01"
            defaultValue={project?.budget}
            className="field-input"
          />
        </label>
        <label className="field-label">
          <span className="field-caption">Project head</span>
          <select
            name="project_head_id"
            required
            defaultValue={project?.project_head_id ?? ""}
            className="field-input"
            disabled={heads.length === 0}
          >
            <option value="" disabled>
              Select a project head
            </option>
            {heads.map((head) => (
              <option key={head.id} value={head.id}>
                {head.full_name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <FormSubmitButton
        pendingLabel={project ? "Saving…" : "Creating…"}
      >
        {project ? "Save project" : "Create project"}
      </FormSubmitButton>
    </form>
  );
}
