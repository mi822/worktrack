"use client";

import { FormSubmitButton } from "@/components/form-submit-button";
import { submitSurveyResponse } from "@/lib/surveys/actions";
import type { SurveyQuestion } from "@/lib/surveys/types";

export function SurveyTakeForm({
  surveyId,
  questions,
}: {
  surveyId: number;
  questions: SurveyQuestion[];
}) {
  return (
    <form action={submitSurveyResponse} className="mt-4 space-y-5">
      <input type="hidden" name="survey_id" value={surveyId} />
      {questions.map((question) => (
        <label key={question.id} className="field-label">
          <span className="field-caption">{question.prompt}</span>
          {question.kind === "rating" ? (
            <select name={`q_${question.id}`} required className="field-input" defaultValue="3">
              {[1, 2, 3, 4, 5].map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          ) : null}
          {question.kind === "yes_no" ? (
            <select name={`q_${question.id}`} required className="field-input">
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          ) : null}
          {question.kind === "choice" ? (
            <select name={`q_${question.id}`} required className="field-input">
              {question.options.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          ) : null}
          {question.kind === "text" ? (
            <textarea name={`q_${question.id}`} rows={3} className="field-input" />
          ) : null}
        </label>
      ))}
      <FormSubmitButton pendingLabel="Submitting…">Submit</FormSubmitButton>
    </form>
  );
}
