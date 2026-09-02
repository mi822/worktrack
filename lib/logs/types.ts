export type EmployeeSummary = {
  id: number;
  user_id: string;
  work_date: string;
  work_completed: string;
  challenges: string;
  general_progress: string;
  planned_next_day: string;
  updated_at: string;
};

export type InternLearningLog = {
  id: number;
  user_id: string;
  work_date: string;
  learned: string;
  activities: string;
  challenges: string;
  skills_gained: string;
  areas_to_improve: string;
  updated_at: string;
  intern_name: string | null;
};

export function requiredText(
  formData: FormData,
  fields: { name: string; label: string }[],
): { values: Record<string, string>; error: string | null } {
  const values: Record<string, string> = {};
  for (const field of fields) {
    const value = String(formData.get(field.name) ?? "").trim();
    if (!value) {
      return {
        values,
        error: `${field.label} is required.`,
      };
    }
    values[field.name] = value;
  }
  return { values, error: null };
}
