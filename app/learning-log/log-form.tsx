import { FormSubmitButton } from "@/components/form-submit-button";
import { saveInternLog } from "@/lib/logs/actions";
import type { InternLearningLog } from "@/lib/logs/types";

export function InternLogForm({
  log,
  error,
  saved,
}: {
  log: InternLearningLog | null;
  error: string | null;
  saved: boolean;
}) {
  return (
    <form action={saveInternLog} className="panel mt-8 space-y-5 p-6">
      {error ? <p className="alert-error">{error}</p> : null}
      {saved ? (
        <p className="rounded-lg border border-line bg-canvas px-3 py-2 text-sm text-ink">
          Learning log saved.
        </p>
      ) : null}
      <label className="field-label">
        <span className="field-caption">What you learned</span>
        <textarea
          name="learned"
          required
          rows={3}
          defaultValue={log?.learned}
          className="field-input h-auto min-h-20 py-2"
        />
      </label>
      <label className="field-label">
        <span className="field-caption">Activities</span>
        <textarea
          name="activities"
          required
          rows={3}
          defaultValue={log?.activities}
          className="field-input h-auto min-h-20 py-2"
        />
      </label>
      <label className="field-label">
        <span className="field-caption">Challenges</span>
        <textarea
          name="challenges"
          required
          rows={3}
          defaultValue={log?.challenges}
          className="field-input h-auto min-h-20 py-2"
        />
      </label>
      <label className="field-label">
        <span className="field-caption">Skills gained</span>
        <textarea
          name="skills_gained"
          required
          rows={3}
          defaultValue={log?.skills_gained}
          className="field-input h-auto min-h-20 py-2"
        />
      </label>
      <label className="field-label">
        <span className="field-caption">Areas to improve</span>
        <textarea
          name="areas_to_improve"
          required
          rows={3}
          defaultValue={log?.areas_to_improve}
          className="field-input h-auto min-h-20 py-2"
        />
      </label>
      <FormSubmitButton pendingLabel="Saving…">Save log</FormSubmitButton>
    </form>
  );
}
