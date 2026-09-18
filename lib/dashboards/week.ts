export type WeekBar = {
  date: string;
  label: string;
  present: number;
  late: number;
};

export function addDaysYmd(ymd: string, days: number): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
  if (!match) {
    return ymd;
  }
  const date = new Date(
    Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])),
  );
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function lastSevenDates(endYmd: string): string[] {
  return Array.from({ length: 7 }, (_, index) => addDaysYmd(endYmd, index - 6));
}

export function shortWeekday(ymd: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
  if (!match) {
    return ymd;
  }
  return new Date(
    Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12),
  ).toLocaleDateString("en-GB", { weekday: "short", timeZone: "UTC" });
}

export function emptyWeek(endYmd: string): WeekBar[] {
  return lastSevenDates(endYmd).map((date) => ({
    date,
    label: shortWeekday(date),
    present: 0,
    late: 0,
  }));
}

export function fillWeek(
  endYmd: string,
  rows: { work_date: string; status: string }[],
): WeekBar[] {
  const week = emptyWeek(endYmd);
  const byDate = new Map(week.map((day) => [day.date, day]));
  for (const row of rows) {
    const bucket = byDate.get(row.work_date);
    if (!bucket) {
      continue;
    }
    if (row.status === "present") {
      bucket.present += 1;
    } else if (row.status === "late") {
      bucket.late += 1;
    }
  }
  return week;
}
