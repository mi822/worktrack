import { TASK_STATUS_LABEL, type ProjectProgress, type TaskStatus } from "@/lib/work/types";

const DETAIL_STATUSES: TaskStatus[] = [
  "pending",
  "in_progress",
  "submitted",
  "approved",
  "rejected",
  "resubmitted",
];

export function ProjectProgressStats({ progress }: { progress: ProjectProgress }) {
  return (
    <div className="min-[480px]:col-span-2">
      <span className="field-caption block">Progress</span>
      <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {DETAIL_STATUSES.map((status) => (
          <p key={status} className="rounded-lg border border-line bg-canvas/60 px-3 py-2">
            <span className="field-caption block">{TASK_STATUS_LABEL[status]}</span>
            <span className="text-sm font-medium text-ink">
              {progress.byStatus[status]}
            </span>
          </p>
        ))}
      </div>
    </div>
  );
}
