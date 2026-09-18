import type { InternLearningLog } from "@/lib/logs/types";
import type { AppRole } from "@/lib/types";
import type {
  ProjectListItem,
  TaskFeedbackListItem,
  TaskListItem,
  TaskStatus,
} from "@/lib/work/types";
import type { WeekBar } from "@/lib/dashboards/week";

export type RoleCount = Record<AppRole, number>;

export type PresenceSnapshot = {
  hoursConfigured: boolean;
  isWorkDay: boolean;
  present: number;
  late: number;
  absent: number;
  expected: number;
  attendancePercent: number | null;
  rowCount: number;
};

export type ProjectSnapshot = {
  total: number;
  active: number;
  completed: number;
  overdue: number;
};

export type AdminDashboard = {
  workDate: string;
  userTotal: number;
  usersByRole: RoleCount;
  presence: PresenceSnapshot;
  projects: ProjectSnapshot;
  tasksByStatus: Record<TaskStatus, number>;
  taskTotal: number;
  employeeCount: number;
  summariesToday: number;
  approvedTasks: number;
  internLogTotal: number;
  internLogsToday: number;
  internCount: number;
  week: WeekBar[];
  avgPerformance: number | null;
  engagementAvgRating: number | null;
  surveyResponseRate: number | null;
};

export type ManagerDashboard = {
  workDate: string;
  projects: ProjectListItem[];
  projectCounts: ProjectSnapshot;
  tasksByStatus: Record<TaskStatus, number>;
  taskTotal: number;
  attention: TaskListItem[];
  teamPresent: number;
  teamLate: number;
  teamAbsent: number;
  teamAvgPerformance: number | null;
};

export type HeadDashboard = {
  workDate: string;
  projects: ProjectListItem[];
  projectCounts: ProjectSnapshot;
  tasksByStatus: Record<TaskStatus, number>;
  taskTotal: number;
  pendingReviews: number;
  overdueTasks: number;
  approved: number;
  rejected: number;
  employeeTaskTotal: number;
  internTaskTotal: number;
  employeeApproved: number;
  internApproved: number;
  internLogs: InternLearningLog[];
  attention: TaskListItem[];
  teamPresent: number;
  teamLate: number;
  teamAbsent: number;
  teamAvgPerformance: number | null;
  engagementAvgRating: number | null;
  surveyResponseRate: number | null;
};

export type WorkerPresence = {
  hoursConfigured: boolean;
  status: "present" | "late" | null;
};

export type WorkerDashboard = {
  workDate: string;
  presence: WorkerPresence;
  tasks: TaskListItem[];
  tasksByStatus: Record<TaskStatus, number>;
  feedback: TaskFeedbackListItem[];
  dailyWriteSubmitted: boolean;
  week: WeekBar[];
  attendancePercent: number | null;
  hoursToday: number | null;
};
