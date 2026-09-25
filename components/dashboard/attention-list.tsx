import { EmptyNote, IconTile, StatusPill } from "@/components/dashboard/ui";
import { EMPTY_TASKS, EMPTY_TASKS_HINT } from "@/lib/dashboards/empty-copy";
import { formatDate } from "@/lib/format-date";
import {
  TASK_STATUS_LABEL,
  type TaskListItem,
  type TaskStatus,
} from "@/lib/work/types";
import Link from "next/link";

function taskTone(status: TaskStatus) {
  if (status === "approved") {
    return "ok" as const;
  }
  if (status === "rejected") {
    return "bad" as const;
  }
  if (status === "submitted" || status === "under_review") {
    return "warn" as const;
  }
  return "action" as const;
}

export function AttentionList({
  tasks,
  workDate,
}: {
  tasks: TaskListItem[];
  workDate: string;
}) {
  if (tasks.length === 0) {
    return (
      <div className="mt-4">
        <EmptyNote title={EMPTY_TASKS}>
          {EMPTY_TASKS_HINT} Overdue and submitted work will show here.
        </EmptyNote>
      </div>
    );
  }

  const overdueCount = tasks.filter(
    (task) => task.deadline < workDate && task.status !== "approved",
  ).length;

  return (
    <div className="mt-4">
      {overdueCount > 0 ? (
        <p className="mb-3 text-sm text-muted">
          Overdue tasks in this list:{" "}
          <span className="font-semibold text-ink">{overdueCount}</span>
        </p>
      ) : null}
      <ul className="card-list">
        {tasks.map((task) => {
          const overdue = task.deadline < workDate && task.status !== "approved";
          return (
            <li key={task.id}>
              <Link
                href={`/tasks/${task.id}`}
                className="card-row outline-none focus-visible:ring-2 focus-visible:ring-action/20"
              >
                <IconTile label={task.project_title ?? task.description} seed={task.project_id} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-ink">{task.description}</p>
                    <StatusPill tone={overdue ? "bad" : taskTone(task.status)}>
                      {overdue ? "Overdue" : TASK_STATUS_LABEL[task.status]}
                    </StatusPill>
                  </div>
                  <p className="mt-1 text-sm text-muted">
                    {formatDate(task.deadline)}
                    {task.assignee_name ? ` · ${task.assignee_name}` : ""}
                    {task.project_title ? ` · ${task.project_title}` : ""}
                  </p>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
