import { AdminDailyAttendance } from "@/components/admin-daily-attendance";
import {
  DashSection,
  EmptyNote,
  Greeting,
  Stat,
  StatGrid,
  WeekBars,
} from "@/components/dashboard/ui";
import { getCurrentProfile } from "@/lib/auth";
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
import { ROLE_HOME_INTRO, ROLE_HOME_LABEL, ROLE_LABEL } from "@/lib/roles";
import { APP_ROLES, type AppRole } from "@/lib/types";
import { TASK_STATUSES, TASK_STATUS_LABEL } from "@/lib/work/types";

const ROLE_TONE: Record<AppRole, "default" | "ok" | "warn" | "action" | "violet"> = {
  intern: "default",
  employee: "ok",
  project_head: "violet",
  manager: "warn",
  admin: "action",
};

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
  const [data, profile] = await Promise.all([
    getAdminDashboard(),
    getCurrentProfile(),
  ]);
  const attendanceLabel = formatPercent(data.presence.attendancePercent);
  const eodShare =
    data.employeeCount === 0
      ? null
      : `${data.summariesToday} of ${data.employeeCount}`;

  return (
    <>
      <Greeting
        name={profile?.full_name ?? ""}
        caption={ROLE_HOME_LABEL.admin}
        intro={ROLE_HOME_INTRO.admin}
      />

      <AdminDailyAttendance
        workDate={data.workDate}
        presence={data.presence}
        notice={adminAttendanceNotice(notice)}
      />

      <DashSection title="Users" description="Account overview" icon="/admin/users">
        {data.userTotal === 0 ? (
          <EmptyNote title={EMPTY_USERS}>{EMPTY_USERS_HINT}</EmptyNote>
        ) : (
          <StatGrid>
            <Stat label="Total" value={data.userTotal} tone="action" icon="/admin/users" />
            {APP_ROLES.map((role) => (
              <Stat
                key={role}
                label={ROLE_LABEL[role]}
                value={data.usersByRole[role]}
                tone={ROLE_TONE[role]}
                icon="user"
              />
            ))}
          </StatGrid>
        )}
      </DashSection>

      <DashSection
        title="Attendance by day"
        description="Present and late this week"
        icon="/performance"
      >
        {data.week.every((day) => day.present + day.late === 0) ? (
          <EmptyNote title={EMPTY_ATTENDANCE}>{EMPTY_ATTENDANCE_HINT}</EmptyNote>
        ) : (
          <WeekBars days={data.week} />
        )}
      </DashSection>

      <DashSection title="Projects" description="All projects in WorkTrack" icon="/projects">
        {data.projects.total === 0 ? (
          <EmptyNote title={EMPTY_PROJECTS}>{EMPTY_PROJECTS_HINT}</EmptyNote>
        ) : (
          <StatGrid>
            <Stat label="Total" value={data.projects.total} tone="action" icon="/projects" />
            <Stat label="Active" value={data.projects.active} tone="action" />
            <Stat label="Completed" value={data.projects.completed} tone="ok" />
            <Stat label="Overdue" value={data.projects.overdue} tone="bad" />
          </StatGrid>
        )}
      </DashSection>

      <DashSection title="Tasks" description="All tasks by status" icon="/tasks">
        {data.taskTotal === 0 ? (
          <EmptyNote title={EMPTY_TASKS}>{EMPTY_TASKS_HINT}</EmptyNote>
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

      <DashSection
        title="Engagement"
        description="Reports, performance and surveys"
        icon="/surveys"
      >
        <StatGrid>
          <Stat
            label="End-of-day today"
            value={eodShare ?? EMPTY_USERS}
            hint={eodShare ? "Employees who wrote today" : undefined}
            icon="/summary"
            tone="action"
          />
          <Stat
            label="Presence rate"
            value={attendanceLabel ?? EMPTY_ATTENDANCE}
            tone="action"
            icon="percent"
          />
          <Stat label="Approved tasks" value={data.approvedTasks} tone="ok" icon="check" />
          <Stat
            label="Avg performance"
            value={data.avgPerformance ?? "—"}
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

      <DashSection title="Learning logs" description="Intern learning activity" icon="/intern-logs">
        {data.internLogTotal === 0 ? (
          <EmptyNote title={EMPTY_LOGS}>{EMPTY_LOGS_HINT}</EmptyNote>
        ) : (
          <StatGrid>
            <Stat label="Total logs" value={data.internLogTotal} tone="action" icon="/intern-logs" />
            <Stat
              label="Submitted today"
              value={data.internLogsToday}
              hint={`${data.internLogsToday} of ${data.internCount} active interns`}
              tone="ok"
            />
            <Stat label="Active interns" value={data.internCount} tone="violet" icon="user" />
          </StatGrid>
        )}
      </DashSection>
    </>
  );
}
