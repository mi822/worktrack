import type { AppRole } from "@/lib/types";

export const ROLE_HOME_LABEL: Record<AppRole, string> = {
  intern: "Intern home",
  employee: "Employee home",
  project_head: "Project head home",
  manager: "Manager home",
  admin: "Admin home",
};

export const ROLE_HOME_INTRO: Record<AppRole, string> = {
  intern: "Here's your work and learning for today.",
  employee: "Here's your work for today.",
  project_head: "Here's what your team is working on today.",
  manager: "Here's how your projects and team are doing today.",
  admin: "Here's what's happening with your team today.",
};

export const ROLE_LABEL: Record<AppRole, string> = {
  intern: "Intern",
  employee: "Employee",
  project_head: "Project head",
  manager: "Manager",
  admin: "Admin",
};

export type NavItem = { href: string; label: string };

export function navForRole(role: AppRole): NavItem[] {
  const home = { href: "/", label: "Home" };
  const shared = [
    { href: "/timesheet", label: "Timesheet" },
    { href: "/surveys", label: "Surveys" },
    { href: "/documents", label: "Documents" },
  ];
  const performance = { href: "/performance", label: "Performance" };
  if (role === "admin") {
    return [
      home,
      { href: "/admin/users", label: "Users" },
      { href: "/admin/hours", label: "Hours" },
      { href: "/admin/qr", label: "QR" },
      { href: "/admin/attendance", label: "Attendance" },
      performance,
      ...shared,
    ];
  }

  const scan = { href: "/scan", label: "Presence" };
  const attendance = { href: "/attendance", label: "Attendance" };
  if (role === "manager") {
    return [
      home,
      scan,
      attendance,
      { href: "/projects", label: "Projects" },
      performance,
      ...shared,
    ];
  }
  if (role === "project_head") {
    return [
      home,
      scan,
      attendance,
      { href: "/projects", label: "Projects" },
      { href: "/intern-logs", label: "Logs" },
      performance,
      ...shared,
    ];
  }
  if (role === "employee") {
    return [
      home,
      scan,
      attendance,
      { href: "/tasks", label: "Tasks" },
      { href: "/summary", label: "Summary" },
      ...shared,
    ];
  }
  if (role === "intern") {
    return [
      home,
      scan,
      attendance,
      { href: "/tasks", label: "Tasks" },
      { href: "/learning-log", label: "Log" },
      ...shared,
    ];
  }
  return [home, scan, attendance, ...shared];
}

export type MobileTabs = {
  left: NavItem[];
  center: NavItem;
  right: NavItem[];
};

export function mobileTabsForRole(role: AppRole): MobileTabs {
  const home = { href: "/", label: "Home" };
  const presence = { href: "/scan", label: "Presence" };
  if (role === "admin") {
    return {
      left: [home, { href: "/admin/users", label: "Users" }],
      center: { href: "/admin/qr", label: "QR" },
      right: [{ href: "/admin/attendance", label: "Attendance" }],
    };
  }
  if (role === "manager") {
    return {
      left: [home, { href: "/projects", label: "Projects" }],
      center: { href: "/projects/new", label: "New project" },
      right: [{ href: "/attendance", label: "Attendance" }],
    };
  }
  if (role === "project_head") {
    return {
      left: [home, { href: "/projects", label: "Projects" }],
      center: presence,
      right: [{ href: "/intern-logs", label: "Logs" }],
    };
  }
  if (role === "employee") {
    return {
      left: [home, { href: "/tasks", label: "Tasks" }],
      center: presence,
      right: [{ href: "/summary", label: "Summary" }],
    };
  }
  return {
    left: [home, { href: "/tasks", label: "Tasks" }],
    center: presence,
    right: [{ href: "/learning-log", label: "Log" }],
  };
}
