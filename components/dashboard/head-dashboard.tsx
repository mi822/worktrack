import { TodayPresence } from "@/components/today-presence";
import { AttentionList } from "@/components/dashboard/attention-list";
import { DashSection, EmptyNote, Stat, StatGrid } from "@/components/dashboard/ui";
import {
  EMPTY_LOGS,
  EMPTY_LOGS_HINT,
  EMPTY_PROJECTS,
  EMPTY_PROJECTS_HINT,
  EMPTY_TASKS,
  EMPTY_TASKS_HINT,
} from "@/lib/dashboards/empty-copy";
import { getHeadDashboard } from "@/lib/dashboards/queries";
import { formatDate } from "@/lib/format-date";
import { ROLE_HOME_LABEL } from "@/lib/roles";
import { progressCopy } from "@/lib/work/queries";
import { PROJECT_STATUS_LABEL } from "@/lib/work/types";
import Link from "next/link";

export async function HeadDashboard({ notice }: { notice?: string | null }) {
  const data = await getHeadDashboard();

  return (
    <>
      <p className="field-caption">Project head</p>
      <h1 className="page-title mt-1">{ROLE_HOME_LABEL.project_head}</h1>

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
          <Stat label="Survey rating" value={data.engagementAvgRating ?? "—"} />
          <Stat
            label="Survey response"
            value={
              data.surveyResponseRate === null
                ? "—"
                : `${Math.round(data.surveyResponseRate * 100)}%`
            }
          />
        </StatGrid>
      </DashSection>

      <DashSection caption="Assigned" title="Projects">
        {data.projectCounts.total === 0 ? (
          <div className="mt-4">
            <EmptyNote title={EMPTY_PROJECTS}>{EMPTY_PROJECTS_HINT}</EmptyNote>
          </div>
        ) : (
          <>
            <StatGrid>
              <Stat label="Total" value={data.projectCounts.total} />
              <Stat label="Active" value={data.projectCounts.active} tone="action" />
              <Stat label="Completed" value={data.projectCounts.completed} tone="ok" />
              <Stat label="Overdue" value={data.projectCounts.overdue} tone="bad" />
            </StatGrid>
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
                      {formatDate(project.deadline)}
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      {progressCopy(project.progress)}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </DashSection>

      <DashSection caption="Needs attention" title="Reviews and overdue">
        <AttentionList tasks={data.attention} workDate={data.workDate} />
      </DashSection>

      <DashSection caption="Assigned" title="Reviews">
        {data.taskTotal === 0 ? (
          <div className="mt-4">
            <EmptyNote title={EMPTY_TASKS}>{EMPTY_TASKS_HINT}</EmptyNote>
          </div>
        ) : (
          <StatGrid>
            <Stat label="Pending reviews" value={data.pendingReviews} tone="warn" />
            <Stat label="Overdue" value={data.overdueTasks} tone="bad" />
            <Stat label="Approved" value={data.approved} tone="ok" />
            <Stat label="Rejected" value={data.rejected} tone="bad" />
            <Stat label="All tasks" value={data.taskTotal} />
          </StatGrid>
        )}
      </DashSection>

      <DashSection caption="Assigned" title="Employee vs intern">
        {data.employeeTaskTotal === 0 && data.internTaskTotal === 0 ? (
          <div className="mt-4">
            <EmptyNote title={EMPTY_TASKS}>{EMPTY_TASKS_HINT}</EmptyNote>
          </div>
        ) : (
          <StatGrid>
            <Stat label="Employee tasks" value={data.employeeTaskTotal} />
            <Stat label="Employee approved" value={data.employeeApproved} tone="ok" />
            <Stat label="Intern tasks" value={data.internTaskTotal} />
            <Stat label="Intern approved" value={data.internApproved} tone="ok" />
          </StatGrid>
        )}
      </DashSection>

      <DashSection caption="Interns" title="Learning logs">
        {data.internLogs.length === 0 ? (
          <div className="mt-4">
            <EmptyNote title={EMPTY_LOGS}>{EMPTY_LOGS_HINT}</EmptyNote>
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-line">
            {data.internLogs.map((log) => (
              <li key={log.id} className="py-4 first:pt-0 last:pb-0">
                <p className="text-sm font-semibold text-ink">
                  {log.intern_name ?? "Intern"}
                </p>
                <p className="mt-1 text-sm text-muted">
                  {formatDate(log.work_date)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </DashSection>
    </>
  );
}
