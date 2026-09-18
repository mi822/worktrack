/** Clock math for timesheets. Values are minutes from local midnight. */

export function timeToMinutes(value: string): number | null {
  const match = /^(\d{2}):(\d{2})(?::(\d{2}))?/.exec(value);
  if (!match) {
    return null;
  }
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) {
    return null;
  }
  return hours * 60 + minutes;
}

export function clockMinutesInZone(iso: string, timezone: string): number | null {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: timezone,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );
  const clock = `${parts.hour}:${parts.minute}`;
  return timeToMinutes(clock === "24:00" ? "00:00" : clock);
}

export function minutesToHours(minutes: number): number {
  return Math.round((Math.max(0, minutes) / 60) * 100) / 100;
}

export function overlapMinutes(
  startA: number,
  endA: number,
  startB: number,
  endB: number,
): number {
  const start = Math.max(startA, startB);
  const end = Math.min(endA, endB);
  return Math.max(0, end - start);
}
