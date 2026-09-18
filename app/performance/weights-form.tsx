import { FormSubmitButton } from "@/components/form-submit-button";
import { savePerformanceWeights } from "@/lib/performance/actions";
import type { PerformanceWeights } from "@/lib/performance/score";

const FIELDS: { key: keyof PerformanceWeights; label: string }[] = [
  { key: "w_completion", label: "Task completion" },
  { key: "w_ontime", label: "On-time completion" },
  { key: "w_attendance", label: "Attendance" },
  { key: "w_quality", label: "Quality (approved vs rejected)" },
  { key: "w_participation", label: "Participation" },
];

export function PerformanceWeightsForm({
  weights,
}: {
  weights: PerformanceWeights;
}) {
  return (
    <form action={savePerformanceWeights} className="mt-4 grid gap-4 min-[480px]:grid-cols-2">
      {FIELDS.map((field) => (
        <label key={field.key} className="field-label">
          <span className="field-caption">{field.label}</span>
          <input
            type="number"
            name={field.key}
            min={0}
            max={1}
            step="0.001"
            required
            defaultValue={weights[field.key]}
            className="field-input"
          />
        </label>
      ))}
      <div className="min-[480px]:col-span-2">
        <FormSubmitButton pendingLabel="Saving…">Save weights</FormSubmitButton>
      </div>
    </form>
  );
}
