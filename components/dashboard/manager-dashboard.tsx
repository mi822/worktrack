import { TodayPresence } from "@/components/today-presence";
import { AttentionList } from "@/components/dashboard/attention-list";
import {
  DashSection,
  EmptyNote,
  Greeting,
  Stat,
  StatGrid,
} from "@/components/dashboard/ui";
import { ProjectCard } from "@/components/project-card";
import { getCurrentProfile } from "@/lib/auth";
import {
  EMPTY_PROJECTS,
  EMPTY_PROJECTS_HINT,
  EMPTY_TASKS,
  EMPTY_TASKS_HINT,
} from "@/lib/dashboards/empty-copy";
import { getManagerDashboard } from "@/lib/dashboards/queries";
import { ROLE_HOME_INTRO, ROLE_HOME_LABEL } from "@/lib/roles";
import { TASK_STATUSES, TASK_STATUS_LABEL } from "@/lib/work/types";

export async function ManagerDashboard({ notice }: { notice?: string | null }) {
  const [data, profile] = await Promise.all([
    getManagerDashboard(),
    getCurrentProfile(),
  ]);

  return (
    <>
      <Greeting
        name={profile?.full_name ?? ""}
        caption={ROLE_HOME_LABEL.manager}
        intro={ROLE_HOME_INTRO.manager}
      />

      <TodayPresence notice={notice} />

      <DashSection
        title="Team today"
        description="Presence and performance of your team"
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
        </StatGrid>
      </DashSection>

      <DashSection title="Projects" description="Overview of your projects" icon="/projects">
        {data.projectCounts.total === 0 ? (
          <EmptyNote title={EMPTY_PROJECTS}>{EMPTY_PROJECTS_HINT}</EmptyNote>
        ) : (
          <StatGrid>
            <Stat label="Total" value={data.projectCounts.total} icon="/projects" tone="action" />
            <Stat label="Active" value={data.projectCounts.active} tone="action" />
            <Stat label="Completed" value={data.projectCounts.completed} tone="ok" />
            <Stat label="Overdue" value={data.projectCounts.overdue} tone="bad" />
          </StatGrid>
        )}
      </DashSection>

      <DashSection
        title="Needs attention"
        description="Reviews waiting and overdue tasks"
        icon="alert"
      >
        <AttentionList tasks={data.attention} workDate={data.workDate} />
      </DashSection>

      <DashSection title="Tasks" description="Tasks across your projects by status" icon="/tasks">
        {data.taskTotal === 0 ? (
          <EmptyNote title={EMPTY_TASKS}>{EMPTY_TASKS_HINT}</EmptyNote>
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

      <DashSection title="Project list" description="Open a project to see its tasks" icon="/projects">
        {data.projects.length === 0 ? (
          <EmptyNote title={EMPTY_PROJECTS}>{EMPTY_PROJECTS_HINT}</EmptyNote>
        ) : (
          <ul className="card-list">
            {data.projects.map((project) => (
              <li key={project.id}>
                <ProjectCard project={project} showBudget />
              </li>
            ))}
          </ul>
        )}
      </DashSection>
    </>
  );
}
