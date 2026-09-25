"use client";

import { EmptyNote, IconTile, StatusPill } from "@/components/dashboard/ui";
import { EMPTY_TASKS, EMPTY_TASKS_HINT } from "@/lib/dashboards/empty-copy";
import { formatDate } from "@/lib/format-date";
import {
  DEADLINE_STATE_LABEL,
  deadlineState,
  type DeadlineState,
} from "@/lib/work/deadline";
import {
  TASK_PRIORITY_LABEL,
  TASK_STATUS_LABEL,
  TASK_STATUSES,
  type TaskListItem,
  type TaskStatus,
} from "@/lib/work/types";
import Link from "next/link";
import { useMemo, useState } from "react";

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

function deadlineTone(state: DeadlineState) {
  if (state === "completed" || state === "on_time") {
    return "ok" as const;
  }
  if (state === "due_soon") {
    return "warn" as const;
  }
  return "bad" as const;
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function TaskList({ tasks }: { tasks: TaskListItem[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const today = useMemo(() => todayIso(), []);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return tasks.filter((task) => {
      if (status !== "all" && task.status !== status) {
        return false;
      }
      if (!needle) {
        return true;
      }
      const haystack = `${task.description} ${task.project_title ?? ""} ${TASK_STATUS_LABEL[task.status]}`.toLowerCase();
      return haystack.includes(needle);
    });
  }, [tasks, query, status]);

  if (tasks.length === 0) {
    return <EmptyNote title={EMPTY_TASKS}>{EMPTY_TASKS_HINT}</EmptyNote>;
  }

  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="field-label">
          <span className="field-caption">Search</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search tasks"
            className="field-input"
          />
        </label>
        <label className="field-label">
          <span className="field-caption">Status</span>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="field-input"
          >
            <option value="all">All</option>
            {TASK_STATUSES.map((value) => (
              <option key={value} value={value}>
                {TASK_STATUS_LABEL[value]}
              </option>
            ))}
          </select>
        </label>
      </div>

      {filtered.length === 0 ? (
        <div className="mt-4">
          <EmptyNote title="No matches.">Try another status or word.</EmptyNote>
        </div>
      ) : (
        <ul className="card-list mt-4">
          {filtered.map((task) => {
            const due = deadlineState(task.deadline, task.status, today);
            const actionLabel =
              task.status === "assigned"
                ? "Start task"
                : task.status === "in_progress"
                  ? "Submit work"
                  : task.status === "rejected"
                    ? "Resume work"
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
                      <StatusPill tone={deadlineTone(due)}>
                        {DEADLINE_STATE_LABEL[due]}
                      </StatusPill>
                    </div>
                    <p className="mt-1 text-sm text-muted">
                      {TASK_PRIORITY_LABEL[task.priority]}
                      {" · "}
                      {formatDate(task.deadline)}
                      {task.project_title ? ` · ${task.project_title}` : ""}
                    </p>
                  </Link>
                  {actionLabel ? (
                    <Link
                      href={`/tasks/${task.id}`}
                      className="btn-primary shrink-0"
                    >
                      {actionLabel}
                    </Link>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
