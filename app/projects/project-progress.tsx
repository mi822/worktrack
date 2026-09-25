import { TASK_STATUS_LABEL, type ProjectProgress, type TaskStatus } from "@/lib/work/types";

const DETAIL_STATUSES: TaskStatus[] = [
  "created",
  "assigned",
  "in_progress",
  "submitted",
  "under_review",
  "approved",
  "rejected",
];

export function ProjectProgressStats({ progress }: { progress: ProjectProgress }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {DETAIL_STATUSES.map((status) => (
        <p key={status} className="stat-tile">
          <span className="block text-xs font-medium text-muted">{TASK_STATUS_LABEL[status]}</span>
          <span className="mt-1 block text-xl font-bold text-ink">
            {progress.byStatus[status]}
          </span>
        </p>
      ))}
    </div>
  );
}
