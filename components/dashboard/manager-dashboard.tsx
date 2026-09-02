import { DashSection, EmptyNote, Stat, StatGrid } from "@/components/dashboard/ui";
import {
  EMPTY_PROJECTS,
  EMPTY_TASKS,
} from "@/lib/dashboards/empty-copy";
import { getManagerDashboard } from "@/lib/dashboards/queries";
import { formatDate } from "@/lib/format-date";
import { ROLE_HOME_LABEL } from "@/lib/roles";
import { progressCopy } from "@/lib/work/queries";
import { TASK_STATUSES, TASK_STATUS_LABEL } from "@/lib/work/types";
import Link from "next/link";

export async function ManagerDashboard() {
  const data = await getManagerDashboard();

  return (
    <>
      <p className="field-caption">Manager</p>
      <h1 className="page-title mt-1">{ROLE_HOME_LABEL.manager}</h1>
      <p className="page-lede">
        Projects you own. Progress and task counts come from those projects only.
      </p>

      <DashSection caption="Your work" title="Projects">
        {data.projectCounts.total === 0 ? (
          <div className="mt-4">
            <EmptyNote>{EMPTY_PROJECTS}</EmptyNote>
          </div>
        ) : (
          <StatGrid>
            <Stat label="Total" value={data.projectCounts.total} />
            <Stat label="Active" value={data.projectCounts.active} />
            <Stat label="Completed" value={data.projectCounts.completed} />
            <Stat label="Overdue" value={data.projectCounts.overdue} />
          </StatGrid>
        )}
      </DashSection>

      <DashSection caption="Your work" title="Tasks">
        {data.taskTotal === 0 ? (
          <div className="mt-4">
            <EmptyNote>{EMPTY_TASKS}</EmptyNote>
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
            <EmptyNote>{EMPTY_PROJECTS}</EmptyNote>
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-line">
            {data.projects.map((project) => (
              <li key={project.id} className="py-4 first:pt-0 last:pb-0">
                <Link
                  href={`/projects/${project.id}`}
                  className="block rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-mark/20"
                >
                  <p className="text-sm font-semibold text-ink">{project.title}</p>
                  <p className="mt-1 text-sm text-muted">
                    Deadline {formatDate(project.deadline)} · Budget {project.budget}
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
