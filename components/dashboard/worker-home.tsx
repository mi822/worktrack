import { DashSection, EmptyNote, Stat, StatGrid } from "@/components/dashboard/ui";
import {
  EMPTY_TASKS,
  HOURS_UNSET,
  NOT_RECORDED,
  NOT_SUBMITTED,
} from "@/lib/dashboards/empty-copy";
import type { WorkerDashboard } from "@/lib/dashboards/types";
import { formatDate, formatDateTime } from "@/lib/format-date";
import { ROLE_HOME_LABEL } from "@/lib/roles";
import {
  TASK_PRIORITY_LABEL,
  TASK_STATUSES,
  TASK_STATUS_LABEL,
} from "@/lib/work/types";
import Link from "next/link";

function presenceCopy(data: WorkerDashboard): string {
  if (!data.presence.hoursConfigured) {
    return HOURS_UNSET;
  }
  if (data.presence.status === "present") {
    return "Present";
  }
  if (data.presence.status === "late") {
    return "Late";
  }
  return NOT_RECORDED;
}

export function WorkerHome({
  role,
  data,
}: {
  role: "employee" | "intern";
  data: WorkerDashboard;
}) {
  const writeHref = role === "employee" ? "/summary" : "/learning-log";
  const writeLabel = role === "employee" ? "End-of-day summary" : "Learning log";

  return (
    <>
      <p className="field-caption">{role === "intern" ? "Intern" : "Employee"}</p>
      <h1 className="page-title mt-1">{ROLE_HOME_LABEL[role]}</h1>
      <p className="page-lede">
        Your presence, tasks, and today’s {role === "intern" ? "learning log" : "summary"} for{" "}
        {formatDate(data.workDate)}.
      </p>

      <DashSection caption="Today" title="Presence">
        <div className="mt-4">
          {data.presence.status ? (
            <StatGrid>
              <Stat label="Status" value={presenceCopy(data)} />
            </StatGrid>
          ) : (
            <EmptyNote>{presenceCopy(data)}</EmptyNote>
          )}
        </div>
      </DashSection>

      <DashSection caption="Assigned" title="Tasks">
        {data.tasks.length === 0 ? (
          <div className="mt-4">
            <EmptyNote>{EMPTY_TASKS}</EmptyNote>
          </div>
        ) : (
          <>
            <StatGrid>
              {TASK_STATUSES.map((status) =>
                data.tasksByStatus[status] > 0 ? (
                  <Stat
                    key={status}
                    label={TASK_STATUS_LABEL[status]}
                    value={data.tasksByStatus[status]}
                  />
                ) : null,
              )}
            </StatGrid>
            <ul className="mt-4 divide-y divide-line">
              {data.tasks.map((task) => (
                <li key={task.id} className="py-4 first:pt-0 last:pb-0">
                  <Link
                    href={`/tasks/${task.id}`}
                    className="block rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-mark/20"
                  >
                    <p className="text-sm font-semibold text-ink">
                      {task.description}
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      {TASK_STATUS_LABEL[task.status]}
                      {" · "}
                      {TASK_PRIORITY_LABEL[task.priority]}
                      {" · "}
                      {formatDate(task.deadline)}
                      {task.project_title ? ` · ${task.project_title}` : ""}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </DashSection>

      <DashSection caption="Assigned" title="Feedback">
        {data.feedback.length === 0 ? (
          <div className="mt-4">
            <EmptyNote>No feedback.</EmptyNote>
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-line">
            {data.feedback.map((item) => (
              <li key={item.id} className="py-4 first:pt-0 last:pb-0">
                <p className="text-sm font-semibold text-ink">
                  {item.task_description}
                </p>
                <p className="mt-1 text-sm text-muted">{item.reason}</p>
                <p className="mt-1 text-xs text-muted">
                  {formatDateTime(item.created_at)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </DashSection>

      <DashSection caption="Today" title={writeLabel}>
        <div className="mt-4">
          {data.dailyWriteSubmitted ? (
            <StatGrid>
              <Stat label="Status" value="Submitted" />
            </StatGrid>
          ) : (
            <EmptyNote>{NOT_SUBMITTED}</EmptyNote>
          )}
          <p className="mt-4">
            <Link href={writeHref} className="btn-secondary">
              Open {writeLabel.toLowerCase()}
            </Link>
          </p>
        </div>
      </DashSection>
    </>
  );
}
