import type { AppRole } from "@/lib/types";

export const ROLE_HOME_LABEL: Record<AppRole, string> = {
  intern: "Intern home",
  employee: "Employee home",
  project_head: "Project head home",
  manager: "Manager home",
  admin: "Admin home",
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
  if (role === "admin") {
    return [
      home,
      { href: "/admin/users", label: "Users" },
      { href: "/admin/hours", label: "Hours" },
      { href: "/admin/qr", label: "QR" },
      { href: "/admin/attendance", label: "Attendance" },
    ];
  }

  const scan = { href: "/scan", label: "Scan" };
  if (role === "manager") {
    return [home, scan, { href: "/projects", label: "Projects" }];
  }
  if (role === "project_head") {
    return [
      home,
      scan,
      { href: "/projects", label: "Projects" },
      { href: "/intern-logs", label: "Logs" },
    ];
  }
  if (role === "employee") {
    return [
      home,
      scan,
      { href: "/tasks", label: "Tasks" },
      { href: "/summary", label: "Summary" },
    ];
  }
  if (role === "intern") {
    return [
      home,
      scan,
      { href: "/tasks", label: "Tasks" },
      { href: "/learning-log", label: "Log" },
    ];
  }
  return [home, scan];
}
