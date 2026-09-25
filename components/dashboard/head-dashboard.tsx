import { TodayPresence } from "@/components/today-presence";
import { AttentionList } from "@/components/dashboard/attention-list";
import {
  DashSection,
  EmptyNote,
  Greeting,
  IconTile,
  Stat,
  StatGrid,
} from "@/components/dashboard/ui";
import { ProjectCard } from "@/components/project-card";
import { getCurrentProfile } from "@/lib/auth";
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
import { ROLE_HOME_INTRO, ROLE_HOME_LABEL } from "@/lib/roles";

export async function HeadDashboard({ notice }: { notice?: string | null }) {
  const [data, profile] = await Promise.all([
    getHeadDashboard(),
    getCurrentProfile(),
  ]);

  return (
    <>
      <Greeting
        name={profile?.full_name ?? ""}
        caption={ROLE_HOME_LABEL.project_head}
        intro={ROLE_HOME_INTRO.project_head}
      />

      <TodayPresence notice={notice} />

      <DashSection
        title="Team today"
        description="Presence, performance and engagement"
        icon="/admin/users"
      >
        <StatGrid>
          <Stat label="Present" value={data.teamPresent} tone="ok" />
          <Stat label="Late" value={data.teamLate} tone="warn" />
          <Stat label="Absent" value={data.teamAbsent} tone="bad" />
          <Stat
            label="Avg performance"
            value={data.teamAvgPerformance ?? "—"}
            tone="action"
            icon="/performance"
          />
          <Stat
            label="Survey rating"
            value={data.engagementAvgRating ?? "—"}
            tone="violet"
            icon="/surveys"
          />
          <Stat
            label="Survey response"
            value={
              data.surveyResponseRate === null
                ? "—"
                : `${Math.round(data.surveyResponseRate * 100)}%`
            }
            tone="violet"
            icon="percent"
          />
        </StatGrid>
      </DashSection>

      <DashSection title="Projects" description="Projects you lead" icon="/projects">
        {data.projectCounts.total === 0 ? (
          <EmptyNote title={EMPTY_PROJECTS}>{EMPTY_PROJECTS_HINT}</EmptyNote>
        ) : (
          <>
            <StatGrid>
              <Stat label="Total" value={data.projectCounts.total} icon="/projects" tone="action" />
              <Stat label="Active" value={data.projectCounts.active} tone="action" />
              <Stat label="Completed" value={data.projectCounts.completed} tone="ok" />
              <Stat label="Overdue" value={data.projectCounts.overdue} tone="bad" />
            </StatGrid>
            <ul className="card-list mt-4">
              {data.projects.map((project) => (
                <li key={project.id}>
                  <ProjectCard project={project} />
                </li>
              ))}
            </ul>
          </>
        )}
      </DashSection>

      <DashSection
        title="Needs attention"
        description="Reviews waiting and overdue tasks"
        icon="alert"
      >
        <AttentionList tasks={data.attention} workDate={data.workDate} />
      </DashSection>

      <DashSection title="Reviews" description="Task reviews across your projects" icon="check">
        {data.taskTotal === 0 ? (
          <EmptyNote title={EMPTY_TASKS}>{EMPTY_TASKS_HINT}</EmptyNote>
        ) : (
          <StatGrid>
            <Stat label="Pending reviews" value={data.pendingReviews} tone="warn" />
            <Stat label="Overdue" value={data.overdueTasks} tone="bad" />
            <Stat label="Approved" value={data.approved} tone="ok" icon="check" />
            <Stat label="Rejected" value={data.rejected} tone="bad" />
            <Stat label="All tasks" value={data.taskTotal} tone="action" icon="/tasks" />
          </StatGrid>
        )}
      </DashSection>

      <DashSection
        title="Employee vs intern"
        description="Task load and approvals by role"
        icon="/admin/users"
      >
        {data.employeeTaskTotal === 0 && data.internTaskTotal === 0 ? (
          <EmptyNote title={EMPTY_TASKS}>{EMPTY_TASKS_HINT}</EmptyNote>
        ) : (
          <StatGrid>
            <Stat label="Employee tasks" value={data.employeeTaskTotal} tone="action" icon="user" />
            <Stat label="Employee approved" value={data.employeeApproved} tone="ok" />
            <Stat label="Intern tasks" value={data.internTaskTotal} tone="violet" icon="user" />
            <Stat label="Intern approved" value={data.internApproved} tone="ok" />
          </StatGrid>
        )}
      </DashSection>

      <DashSection title="Learning logs" description="Recent logs from interns" icon="/intern-logs">
        {data.internLogs.length === 0 ? (
          <EmptyNote title={EMPTY_LOGS}>{EMPTY_LOGS_HINT}</EmptyNote>
        ) : (
          <ul className="card-list">
            {data.internLogs.map((log) => (
              <li key={log.id} className="card-row">
                <IconTile label={log.intern_name ?? "Intern"} seed={log.id} />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink">
                    {log.intern_name ?? "Intern"}
                  </p>
                  <p className="mt-1 text-sm text-muted">
                    {formatDate(log.work_date)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </DashSection>
    </>
  );
}
