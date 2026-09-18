import { TodayPresence } from "@/components/today-presence";
import { AttentionList } from "@/components/dashboard/attention-list";
import { DashSection, EmptyNote, Stat, StatGrid } from "@/components/dashboard/ui";
import {
  EMPTY_PROJECTS,
  EMPTY_PROJECTS_HINT,
  EMPTY_TASKS,
  EMPTY_TASKS_HINT,
} from "@/lib/dashboards/empty-copy";
import { getManagerDashboard } from "@/lib/dashboards/queries";
import { formatDate } from "@/lib/format-date";
import { ROLE_HOME_LABEL } from "@/lib/roles";
import { progressCopy } from "@/lib/work/queries";
import { PROJECT_STATUS_LABEL, TASK_STATUSES, TASK_STATUS_LABEL } from "@/lib/work/types";
import Link from "next/link";

export async function ManagerDashboard({ notice }: { notice?: string | null }) {
  const data = await getManagerDashboard();

  return (
    <>
      <p className="field-caption">Manager</p>
      <h1 className="page-title mt-1">{ROLE_HOME_LABEL.manager}</h1>

      <TodayPresence notice={notice} />

      <DashSection caption="Team" title="Presence and performance">
        <StatGrid>
          <Stat label="Present" value={data.teamPresent} tone="ok" />
          <Stat label="Late" value={data.teamLate} tone="warn" />
          <Stat label="Absent" value={data.teamAbsent} tone="bad" />
          <Stat
            label="Avg performance"
            value={data.teamAvgPerformance ?? "—"}
            tone="action"
          />
        </StatGrid>
      </DashSection>

      <DashSection caption="Your work" title="Projects">
        {data.projectCounts.total === 0 ? (
          <div className="mt-4">
            <EmptyNote title={EMPTY_PROJECTS}>{EMPTY_PROJECTS_HINT}</EmptyNote>
          </div>
        ) : (
          <StatGrid>
            <Stat label="Total" value={data.projectCounts.total} />
            <Stat label="Active" value={data.projectCounts.active} tone="action" />
            <Stat label="Completed" value={data.projectCounts.completed} tone="ok" />
            <Stat label="Overdue" value={data.projectCounts.overdue} tone="bad" />
          </StatGrid>
        )}
      </DashSection>

      <DashSection caption="Needs attention" title="Reviews and overdue">
        <AttentionList tasks={data.attention} workDate={data.workDate} />
      </DashSection>

      <DashSection caption="Your work" title="Tasks">
        {data.taskTotal === 0 ? (
          <div className="mt-4">
            <EmptyNote title={EMPTY_TASKS}>{EMPTY_TASKS_HINT}</EmptyNote>
          </div>
        ) : (
          <StatGrid>
            {TASK_STATUSES.map((status) => (
              <Stat
                key={status}
                label={TASK_STATUS_LABEL[status]}
                value={data.tasksByStatus[status]}
              />
            ))}
          </StatGrid>
        )}
      </DashSection>

      <DashSection caption="Your work" title="Project list">
        {data.projects.length === 0 ? (
          <div className="mt-4">
            <EmptyNote title={EMPTY_PROJECTS}>{EMPTY_PROJECTS_HINT}</EmptyNote>
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-line">
            {data.projects.map((project) => (
              <li key={project.id} className="py-4 first:pt-0 last:pb-0">
                <Link
                  href={`/projects/${project.id}`}
                  className="block rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-action/20"
                >
                  <p className="text-sm font-semibold text-ink">{project.title}</p>
                  <p className="mt-1 text-sm text-muted">
                    {PROJECT_STATUS_LABEL[project.status]}
                    {" · Deadline "}
                    {formatDate(project.deadline)} · Budget {project.budget}
                    {project.head_name ? ` · ${project.head_name}` : ""}
                  </p>
                  <p className="mt-1 text-sm text-muted">
                    {progressCopy(project.progress)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </DashSection>
    </>
  );
}
