export function reminderTaskHref(taskId: number): string {
  return `/tasks/${taskId}`;
}

export function reminderProjectHref(projectId: number): string {
  return `/projects/${projectId}`;
}

export function reminderActivityHref(role: "employee" | "intern"): string {
  return role === "employee" ? "/summary" : "/learning-log";
}

export function deadlineWindow(today: string, horizonDays = 2): {
  start: string;
  end: string;
} {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(today);
  if (!match) {
    return { start: today, end: today };
  }
  const end = new Date(
    Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]) + horizonDays),
  )
    .toISOString()
    .slice(0, 10);
  return { start: today, end };
}

export function isDeadlineApproaching(
  deadline: string,
  today: string,
  horizonDays = 2,
): boolean {
  const { start, end } = deadlineWindow(today, horizonDays);
  return deadline >= start && deadline <= end;
}
