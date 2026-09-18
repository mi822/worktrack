import { FormSubmitButton } from "@/components/form-submit-button";
import { createPerformanceReview } from "@/lib/performance/actions";

export function PerformanceReviewForm({ subjectId }: { subjectId: string }) {
  return (
    <form action={createPerformanceReview} className="mt-4 space-y-4">
      <input type="hidden" name="subject_id" value={subjectId} />
      <label className="field-label">
        <span className="field-caption">Rating (1–5)</span>
        <select name="rating" required className="field-input" defaultValue="3">
          <option value="1">1</option>
          <option value="2">2</option>
          <option value="3">3</option>
          <option value="4">4</option>
          <option value="5">5</option>
        </select>
      </label>
      <label className="field-label">
        <span className="field-caption">Comments</span>
        <textarea
          name="comments"
          required
          rows={4}
          maxLength={2000}
          className="field-input"
        />
      </label>
      <FormSubmitButton pendingLabel="Saving…">Save review</FormSubmitButton>
    </form>
  );
}
