import { DashSection, EmptyNote, Stat, StatGrid } from "@/components/dashboard/ui";
import { formatPercent } from "@/lib/dashboards/classify";
import {
  EMPTY_ATTENDANCE,
  EMPTY_LOGS,
  EMPTY_PROJECTS,
  EMPTY_TASKS,
  EMPTY_USERS,
  HOURS_UNSET,
} from "@/lib/dashboards/empty-copy";
import { getAdminDashboard } from "@/lib/dashboards/queries";
import { formatDate } from "@/lib/format-date";
import { ROLE_HOME_LABEL, ROLE_LABEL } from "@/lib/roles";
import { APP_ROLES } from "@/lib/types";
import { TASK_STATUSES, TASK_STATUS_LABEL } from "@/lib/work/types";

export async function AdminDashboard() {
  const data = await getAdminDashboard();
  const attendanceLabel = formatPercent(data.presence.attendancePercent);
  const eodShare =
    data.employeeCount === 0
      ? null
      : `${data.summariesToday} of ${data.employeeCount}`;

  return (
    <>
      <p className="field-caption">Admin</p>
      <h1 className="page-title mt-1">{ROLE_HOME_LABEL.admin}</h1>
      <p className="page-lede">
        Live counts for {formatDate(data.workDate)}. Empty sections stay empty.
      </p>

      <DashSection caption="Accounts" title="Users">
        {data.userTotal === 0 ? (
          <div className="mt-4">
            <EmptyNote>{EMPTY_USERS}</EmptyNote>
          </div>
        ) : (
          <StatGrid>
            <Stat label="Total" value={data.userTotal} />
            {APP_ROLES.map((role) => (
              <Stat
                key={role}
                label={ROLE_LABEL[role]}
                value={data.usersByRole[role]}
              />
            ))}
          </StatGrid>
        )}
      </DashSection>

      <DashSection caption="Today" title="Presence">
        {!data.presence.hoursConfigured ? (
          <div className="mt-4">
            <EmptyNote>{HOURS_UNSET}</EmptyNote>
          </div>
        ) : data.presence.rowCount === 0 && data.presence.expected === 0 ? (
          <div className="mt-4">
            <EmptyNote>{EMPTY_ATTENDANCE}</EmptyNote>
          </div>
        ) : (
          <StatGrid>
            <Stat label="Present" value={data.presence.present} />
            <Stat label="Late" value={data.presence.late} />
            <Stat label="Absent" value={data.presence.absent} />
            <Stat
              label="Attendance"
              value={attendanceLabel ?? EMPTY_ATTENDANCE}
            />
          </StatGrid>
        )}
      </DashSection>

      <DashSection caption="Work" title="Projects">
        {data.projects.total === 0 ? (
          <div className="mt-4">
            <EmptyNote>{EMPTY_PROJECTS}</EmptyNote>
          </div>
        ) : (
          <StatGrid>
            <Stat label="Total" value={data.projects.total} />
            <Stat label="Active" value={data.projects.active} />
            <Stat label="Completed" value={data.projects.completed} />
            <Stat label="Overdue" value={data.projects.overdue} />
          </StatGrid>
        )}
      </DashSection>

      <DashSection caption="Work" title="Tasks">
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

      <DashSection caption="Engagement" title="Real series">
        <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-muted">
          Three live counts, not a composite score.
        </p>
        <StatGrid>
          <Stat
            label="End-of-day today"
            value={eodShare ?? EMPTY_USERS}
          />
          <Stat
            label="Presence rate"
            value={attendanceLabel ?? EMPTY_ATTENDANCE}
          />
          <Stat label="Approved tasks" value={data.approvedTasks} />
        </StatGrid>
      </DashSection>

      <DashSection caption="Interns" title="Learning logs">
        {data.internLogTotal === 0 ? (
          <div className="mt-4">
            <EmptyNote>{EMPTY_LOGS}</EmptyNote>
          </div>
        ) : (
          <StatGrid>
            <Stat label="Total logs" value={data.internLogTotal} />
            <Stat label="Submitted today" value={data.internLogsToday} />
            <Stat label="Active interns" value={data.internCount} />
          </StatGrid>
        )}
      </DashSection>
    </>
  );
}
