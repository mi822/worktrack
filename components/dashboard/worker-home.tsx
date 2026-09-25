import { TodayPresence } from "@/components/today-presence";
import {
  DashSection,
  EmptyNote,
  Greeting,
  IconTile,
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
import { ROLE_HOME_INTRO, ROLE_HOME_LABEL } from "@/lib/roles";
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
  name,
  data,
  notice,
}: {
  role: "employee" | "intern";
  name: string;
  data: WorkerDashboard;
  notice?: string | null;
}) {
  const writeHref = role === "employee" ? "/summary" : "/learning-log";
  const writeLabel = role === "employee" ? "End-of-day summary" : "Learning log";
  const approved = data.tasksByStatus.approved;
  const total = data.tasks.length;

  return (
    <>
      <Greeting
        name={name}
        caption={ROLE_HOME_LABEL[role]}
        intro={ROLE_HOME_INTRO[role]}
      />

      <TodayPresence notice={notice} />

      <DashSection title="Your tasks" description="Tasks assigned to you" icon="/tasks">
        {data.tasks.length === 0 ? (
          <EmptyNote title={EMPTY_TASKS}>{EMPTY_TASKS_HINT}</EmptyNote>
        ) : (
          <>
            <p className="text-sm text-muted">
              {approved} of {total} tasks approved
            </p>
            <ProgressBar value={approved} max={total} />
            <ul className="card-list mt-4">
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
                  <li key={task.id} className="card-row">
                    <IconTile label={task.project_title ?? task.description} seed={task.project_id} />
                    <div className="flex min-w-0 flex-1 flex-wrap items-start justify-between gap-3">
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

      <DashSection title="Hours" description="Your time and attendance" icon="/timesheet">
        <StatGrid>
          <Stat label="Hours today" value={data.hoursToday ?? "—"} icon="/timesheet" tone="action" />
          <Stat
            label="Attendance"
            value={
              data.attendancePercent === null
                ? "—"
                : `${data.attendancePercent}%`
            }
            icon="percent"
            tone="ok"
          />
        </StatGrid>
      </DashSection>

      <DashSection title="Your attendance" description="This week, day by day" icon="/attendance">
        {data.week.every((day) => day.present + day.late === 0) ? (
          <EmptyNote title={NOT_RECORDED}>
            Bars appear after you record presence on a working day.
          </EmptyNote>
        ) : (
          <WeekBars days={data.week} />
        )}
      </DashSection>

      <DashSection title="Feedback" description="Notes from your reviewers" icon="/surveys">
        {data.feedback.length === 0 ? (
          <EmptyNote>No feedback.</EmptyNote>
        ) : (
          <ul className="card-list">
            {data.feedback.map((item) => (
              <li key={item.id} className="card-row">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink">
                    {item.task_description}
                  </p>
                  <p className="mt-1 text-sm text-muted">{item.reason}</p>
                  <p className="mt-1 text-xs text-muted">
                    {formatDateTime(item.created_at)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </DashSection>

      <DashSection
        title={writeLabel}
        description="Today's written report"
        icon={writeHref}
      >
        {data.dailyWriteSubmitted ? (
          <StatGrid>
            <Stat label="Status" value="Submitted" tone="ok" icon="check" />
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
      </DashSection>
    </>
  );
}
