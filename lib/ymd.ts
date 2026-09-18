/** Civil YYYY-MM-DD helpers. Dates are calendar values, not timestamps. */

const YMD = /^(\d{4})-(\d{2})-(\d{2})$/;

export function isYmd(value: string): boolean {
  return YMD.test(value);
}

export function addDaysYmd(ymd: string, days: number): string {
  const match = YMD.exec(ymd);
  if (!match) {
    return ymd;
  }
  const utc = Date.UTC(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]) + days,
  );
  return new Date(utc).toISOString().slice(0, 10);
}

export function eachYmd(start: string, end: string): string[] {
  if (end < start) {
    return [];
  }
  const dates: string[] = [];
  let cursor = start;
  while (cursor <= end) {
    dates.push(cursor);
    cursor = addDaysYmd(cursor, 1);
  }
  return dates;
}

export function rollingPeriod(endYmd: string, length = 30): {
  start: string;
  end: string;
} {
  return { start: addDaysYmd(endYmd, -(length - 1)), end: endYmd };
}
