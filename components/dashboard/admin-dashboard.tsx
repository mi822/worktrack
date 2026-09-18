import { AdminDailyAttendance } from "@/components/admin-daily-attendance";
import {
  DashSection,
  EmptyNote,
  Stat,
  StatGrid,
  WeekBars,
} from "@/components/dashboard/ui";
import {
  EMPTY_ATTENDANCE,
  EMPTY_ATTENDANCE_HINT,
  EMPTY_LOGS,
  EMPTY_LOGS_HINT,
  EMPTY_PROJECTS,
  EMPTY_PROJECTS_HINT,
  EMPTY_TASKS,
  EMPTY_TASKS_HINT,
  EMPTY_USERS,
  EMPTY_USERS_HINT,
} from "@/lib/dashboards/empty-copy";
import { formatPercent } from "@/lib/dashboards/classify";
import { getAdminDashboard } from "@/lib/dashboards/queries";
import { messageForPresenceCode } from "@/lib/presence/messages";
import { ROLE_HOME_LABEL, ROLE_LABEL } from "@/lib/roles";
import { APP_ROLES } from "@/lib/types";
import { TASK_STATUSES, TASK_STATUS_LABEL } from "@/lib/work/types";

function adminAttendanceNotice(code: string | null | undefined) {
  if (code === "activated" || code === "already_active") {
    return "Today's attendance is active.";
  }
  if (code === "closed" || code === "already_closed") {
    return "Today's attendance is closed.";
  }
  if (!code) {
    return null;
  }
  return messageForPresenceCode(code);
}

export async function AdminDashboard({ notice }: { notice?: string | null }) {
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

      <AdminDailyAttendance
        workDate={data.workDate}
        presence={data.presence}
        notice={adminAttendanceNotice(notice)}
      />

      <DashSection caption="Accounts" title="Users">
        {data.userTotal === 0 ? (
          <div className="mt-4">
            <EmptyNote title={EMPTY_USERS}>{EMPTY_USERS_HINT}</EmptyNote>
          </div>
        ) : (
          <StatGrid>
            <Stat label="Total" value={data.userTotal} tone="action" />
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

      <DashSection caption="This week" title="Attendance by day">
        {data.week.every((day) => day.present + day.late === 0) ? (
          <div className="mt-4">
            <EmptyNote title={EMPTY_ATTENDANCE}>{EMPTY_ATTENDANCE_HINT}</EmptyNote>
          </div>
        ) : (
          <WeekBars days={data.week} />
        )}
      </DashSection>

      <DashSection caption="Work" title="Projects">
        {data.projects.total === 0 ? (
          <div className="mt-4">
            <EmptyNote title={EMPTY_PROJECTS}>{EMPTY_PROJECTS_HINT}</EmptyNote>
          </div>
        ) : (
          <StatGrid>
            <Stat label="Total" value={data.projects.total} />
            <Stat label="Active" value={data.projects.active} tone="action" />
            <Stat label="Completed" value={data.projects.completed} tone="ok" />
            <Stat label="Overdue" value={data.projects.overdue} tone="bad" />
          </StatGrid>
        )}
      </DashSection>

      <DashSection caption="Work" title="Tasks">
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
                tone={
                  status === "approved"
                    ? "ok"
                    : status === "rejected"
                      ? "bad"
                      : status === "submitted" || status === "under_review"
                        ? "warn"
                        : "default"
                }
              />
            ))}
          </StatGrid>
        )}
      </DashSection>

      <DashSection caption="Engagement" title="Real series">
        <StatGrid>
          <Stat
            label="End-of-day today"
            value={eodShare ?? EMPTY_USERS}
            hint={eodShare ? "Employees who wrote today" : undefined}
          />
          <Stat
            label="Presence rate"
            value={attendanceLabel ?? EMPTY_ATTENDANCE}
            tone="action"
          />
          <Stat label="Approved tasks" value={data.approvedTasks} tone="ok" />
          <Stat
            label="Avg performance"
            value={data.avgPerformance ?? "—"}
            tone="action"
          />
          <Stat
            label="Survey rating"
            value={data.engagementAvgRating ?? "—"}
          />
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

      <DashSection caption="Interns" title="Learning logs">
        {data.internLogTotal === 0 ? (
          <div className="mt-4">
            <EmptyNote title={EMPTY_LOGS}>{EMPTY_LOGS_HINT}</EmptyNote>
          </div>
        ) : (
          <StatGrid>
            <Stat label="Total logs" value={data.internLogTotal} />
            <Stat
              label="Submitted today"
              value={data.internLogsToday}
              hint={`${data.internLogsToday} of ${data.internCount} active interns`}
            />
            <Stat label="Active interns" value={data.internCount} />
          </StatGrid>
        )}
      </DashSection>
    </>
  );
}
