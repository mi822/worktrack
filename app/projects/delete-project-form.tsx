"use client";

import { FormSubmitButton } from "@/components/form-submit-button";
import { deleteProject } from "@/lib/work/project-actions";

export function DeleteProjectForm({
  projectId,
  title,
}: {
  projectId: number;
  title: string;
}) {
  return (
    <form
      action={deleteProject}
      className="mt-4"
      onSubmit={(event) => {
        const ok = window.confirm(
          `Delete "${title}"? Its tasks, submissions, and files will be removed. This cannot be undone.`,
        );
        if (!ok) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={projectId} />
      <FormSubmitButton
        pendingLabel="Deleting…"
        className="btn-secondary border-bad/40 text-bad hover:bg-bad/5"
      >
        Delete project
      </FormSubmitButton>
    </form>
  );
}
