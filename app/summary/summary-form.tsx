import { SectionHeader } from "@/components/dashboard/ui";
import { FormSubmitButton } from "@/components/form-submit-button";
import { saveEmployeeSummary } from "@/lib/logs/actions";
import type { EmployeeSummary } from "@/lib/logs/types";

export function EmployeeSummaryForm({
  summary,
  error,
  saved,
}: {
  summary: EmployeeSummary | null;
  error: string | null;
  saved: boolean;
}) {
  return (
    <form action={saveEmployeeSummary} className="panel mt-6 space-y-5 p-5 sm:p-6">
      <SectionHeader
        icon="/summary"
        title="Today's summary"
        description="Work completed, challenges, progress and plans"
      />
      {error ? <p className="alert-error">{error}</p> : null}
      {saved ? (
        <p className="rounded-xl border border-line bg-white px-4 py-3 text-sm text-ink">
          Summary saved.
        </p>
      ) : null}
      <label className="field-label">
        <span className="field-caption">Work completed</span>
        <textarea
          name="work_completed"
          required
          rows={3}
          defaultValue={summary?.work_completed}
          className="field-input h-auto min-h-20 py-2"
        />
      </label>
      <label className="field-label">
        <span className="field-caption">Challenges</span>
        <textarea
          name="challenges"
          required
          rows={3}
          defaultValue={summary?.challenges}
          className="field-input h-auto min-h-20 py-2"
        />
      </label>
      <label className="field-label">
        <span className="field-caption">General progress</span>
        <textarea
          name="general_progress"
          required
          rows={3}
          defaultValue={summary?.general_progress}
          className="field-input h-auto min-h-20 py-2"
        />
      </label>
      <label className="field-label">
        <span className="field-caption">Planned work for the next day</span>
        <textarea
          name="planned_next_day"
          required
          rows={3}
          defaultValue={summary?.planned_next_day}
          className="field-input h-auto min-h-20 py-2"
        />
      </label>
      <FormSubmitButton pendingLabel="Saving…">Save summary</FormSubmitButton>
    </form>
  );
}
