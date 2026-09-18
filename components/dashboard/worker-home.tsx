import { TodayPresence } from "@/components/today-presence";
import {
  DashSection,
  EmptyNote,
  ProgressBar,
  Stat,
  StatGrid,
  StatusPill,
  WeekBars,
} from "@/components/dashboard/ui";
import {
  EMPTY_TASKS,
  EMPTY_TASKS_HINT,
  NOT_RECORDED,
  NOT_SUBMITTED,
} from "@/lib/dashboards/empty-copy";
import type { WorkerDashboard } from "@/lib/dashboards/types";
import { formatDate, formatDateTime } from "@/lib/format-date";
import { ROLE_HOME_LABEL } from "@/lib/roles";
import {
  TASK_PRIORITY_LABEL,
  TASK_STATUS_LABEL,
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
  if (status === "in_progress") {
    return "action" as const;
  }
  return "muted" as const;
}

export function WorkerHome({
  role,
  data,
  notice,
}: {
  role: "employee" | "intern";
  data: WorkerDashboard;
  notice?: string | null;
}) {
  const writeHref = role === "employee" ? "/summary" : "/learning-log";
  const writeLabel = role === "employee" ? "End-of-day summary" : "Learning log";
  const approved = data.tasksByStatus.approved;
  const total = data.tasks.length;

  return (
    <>
      <p className="field-caption">{role === "intern" ? "Intern" : "Employee"}</p>
      <h1 className="page-title mt-1">{ROLE_HOME_LABEL[role]}</h1>

      <TodayPresence notice={notice} />

      <DashSection caption="Assigned" title="Your tasks">
        {data.tasks.length === 0 ? (
          <div className="mt-4">
            <EmptyNote title={EMPTY_TASKS}>{EMPTY_TASKS_HINT}</EmptyNote>
          </div>
        ) : (
          <>
            <p className="mt-3 text-sm text-muted">
              {approved} of {total} tasks approved
            </p>
            <ProgressBar value={approved} max={total} />
            <ul className="mt-4 divide-y divide-line">
              {data.tasks.map((task) => {
                const actionLabel =
                  task.status === "assigned"
                    ? "Start task"
                    : task.status === "in_progress"
                      ? "Submit work"
                      : task.status === "rejected"
                        ? "Resume work"
                        : task.status === "submitted" ||
                            task.status === "under_review"
                          ? "Waiting for review"
                          : null;
                return (
                  <li key={task.id} className="py-4 first:pt-0 last:pb-0">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <Link
                        href={`/tasks/${task.id}`}
                        className="min-w-0 flex-1 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-action/20"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-ink">
                            {task.description}
                          </p>
                          <StatusPill tone={taskTone(task.status)}>
                            {TASK_STATUS_LABEL[task.status]}
                          </StatusPill>
                        </div>
                        <p className="mt-1 text-sm text-muted">
                          {TASK_PRIORITY_LABEL[task.priority]}
                          {" · "}
                          {formatDate(task.deadline)}
                          {task.project_title ? ` · ${task.project_title}` : ""}
                        </p>
                      </Link>
                      {actionLabel &&
                      (task.status === "assigned" ||
                        task.status === "in_progress" ||
                        task.status === "rejected") ? (
                        <Link
                          href={`/tasks/${task.id}`}
                          className="btn-primary shrink-0"
                        >
                          {actionLabel}
                        </Link>
                      ) : actionLabel ? (
                        <span className="shrink-0 text-sm text-muted">
                          {actionLabel}
                        </span>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
            <p className="mt-4">
              <Link href="/tasks" className="btn-secondary">
                All tasks
              </Link>
            </p>
          </>
        )}
      </DashSection>

      <DashSection caption="Today" title="Hours">
        <StatGrid>
          <Stat label="Hours today" value={data.hoursToday ?? "—"} />
          <Stat
            label="Attendance"
            value={
              data.attendancePercent === null
                ? "—"
                : `${data.attendancePercent}%`
            }
            tone="action"
          />
        </StatGrid>
      </DashSection>

      <DashSection caption="This week" title="Your attendance">
        {data.week.every((day) => day.present + day.late === 0) ? (
          <div className="mt-4">
            <EmptyNote title={NOT_RECORDED}>
              Bars appear after you record presence on a working day.
            </EmptyNote>
          </div>
        ) : (
          <WeekBars days={data.week} />
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
              <Stat label="Status" value="Submitted" tone="ok" />
            </StatGrid>
          ) : (
            <EmptyNote title={NOT_SUBMITTED}>
              Open the form to write today’s {writeLabel.toLowerCase()}.
            </EmptyNote>
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
