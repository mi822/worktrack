import { DashSection, EmptyNote, Stat, StatGrid } from "@/components/dashboard/ui";
import {
  EMPTY_LOGS,
  EMPTY_PROJECTS,
  EMPTY_TASKS,
} from "@/lib/dashboards/empty-copy";
import { getHeadDashboard } from "@/lib/dashboards/queries";
import { formatDate } from "@/lib/format-date";
import { ROLE_HOME_LABEL } from "@/lib/roles";
import { progressCopy } from "@/lib/work/queries";
import Link from "next/link";

export async function HeadDashboard() {
  const data = await getHeadDashboard();

  return (
    <>
      <p className="field-caption">Project head</p>
      <h1 className="page-title mt-1">{ROLE_HOME_LABEL.project_head}</h1>
      <p className="page-lede">
        Projects assigned to you. Pending reviews are submitted or resubmitted
        tasks.
      </p>

      <DashSection caption="Assigned" title="Projects">
        {data.projectCounts.total === 0 ? (
          <div className="mt-4">
            <EmptyNote>{EMPTY_PROJECTS}</EmptyNote>
          </div>
        ) : (
          <>
            <StatGrid>
              <Stat label="Total" value={data.projectCounts.total} />
              <Stat label="Active" value={data.projectCounts.active} />
              <Stat label="Completed" value={data.projectCounts.completed} />
              <Stat label="Overdue" value={data.projectCounts.overdue} />
            </StatGrid>
            <ul className="mt-4 divide-y divide-line">
              {data.projects.map((project) => (
                <li key={project.id} className="py-4 first:pt-0 last:pb-0">
                  <Link
                    href={`/projects/${project.id}`}
                    className="block rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-mark/20"
                  >
                    <p className="text-sm font-semibold text-ink">{project.title}</p>
                    <p className="mt-1 text-sm text-muted">
                      Deadline {formatDate(project.deadline)}
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

      <DashSection caption="Assigned" title="Reviews">
        {data.taskTotal === 0 ? (
          <div className="mt-4">
            <EmptyNote>{EMPTY_TASKS}</EmptyNote>
          </div>
        ) : (
          <StatGrid>
            <Stat label="Pending reviews" value={data.pendingReviews} />
            <Stat label="Approved" value={data.approved} />
            <Stat label="Rejected" value={data.rejected} />
            <Stat label="All tasks" value={data.taskTotal} />
          </StatGrid>
        )}
      </DashSection>

      <DashSection caption="Assigned" title="Employee vs intern">
        {data.employeeTaskTotal === 0 && data.internTaskTotal === 0 ? (
          <div className="mt-4">
            <EmptyNote>{EMPTY_TASKS}</EmptyNote>
          </div>
        ) : (
          <StatGrid>
            <Stat label="Employee tasks" value={data.employeeTaskTotal} />
            <Stat label="Employee approved" value={data.employeeApproved} />
            <Stat label="Intern tasks" value={data.internTaskTotal} />
            <Stat label="Intern approved" value={data.internApproved} />
          </StatGrid>
        )}
      </DashSection>

      <DashSection caption="Interns" title="Learning logs">
        {data.internLogs.length === 0 ? (
          <div className="mt-4">
            <EmptyNote>{EMPTY_LOGS}</EmptyNote>
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
