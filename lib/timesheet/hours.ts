import {
  minutesToHours,
  overlapMinutes,
  timeToMinutes,
} from "@/lib/clock";

export type TimesheetDayInput = {
  workStart: string;
  workEnd: string;
  breakStart: string | null;
  breakEnd: string | null;
  scannedMinutes: number | null;
  presenceStatus: "present" | "late" | null;
  lateThresholdMinutes: number;
};

export type TimesheetDayHours = {
  expectedHours: number;
  actualHours: number;
  lateMinutes: number;
  earlyDeparture: null;
  overtime: null;
  status: "absent" | "present" | "late";
};

function breakWindow(
  breakStart: string | null,
  breakEnd: string | null,
): { start: number; end: number } | null {
  if (!breakStart || !breakEnd) {
    return null;
  }
  const start = timeToMinutes(breakStart);
  const end = timeToMinutes(breakEnd);
  if (start === null || end === null || end <= start) {
    return null;
  }
  return { start, end };
}

/**
 * Hours are derived from the arrival scan and the configured work end.
 * There is no checkout, so early departure and overtime are not available.
 * Early arrival is billed from work_start, not from the scan.
 */
export function computeTimesheetDay(input: TimesheetDayInput): TimesheetDayHours {
  const start = timeToMinutes(input.workStart);
  const end = timeToMinutes(input.workEnd);
  const empty: TimesheetDayHours = {
    expectedHours: 0,
    actualHours: 0,
    lateMinutes: 0,
    earlyDeparture: null,
    overtime: null,
    status: "absent",
  };
  if (start === null || end === null || end <= start) {
    return empty;
  }

  const pause = breakWindow(input.breakStart, input.breakEnd);
  const expectedMinutes =
    end - start - (pause ? overlapMinutes(start, end, pause.start, pause.end) : 0);
  const expectedHours = minutesToHours(expectedMinutes);

  if (input.scannedMinutes === null || !input.presenceStatus) {
    return { ...empty, expectedHours };
  }

  const billableStart = Math.max(input.scannedMinutes, start);
  const span = Math.max(0, end - billableStart);
  const pauseOverlap = pause
    ? overlapMinutes(billableStart, end, pause.start, pause.end)
    : 0;
  const actualMinutes = Math.min(expectedMinutes, Math.max(0, span - pauseOverlap));
  const graceEnd = start + Math.max(0, input.lateThresholdMinutes);
  const lateMinutes =
    input.presenceStatus === "late"
      ? Math.max(0, input.scannedMinutes - start)
      : input.scannedMinutes > graceEnd
        ? Math.max(0, input.scannedMinutes - start)
        : 0;

  return {
    expectedHours,
    actualHours: minutesToHours(actualMinutes),
    lateMinutes,
    earlyDeparture: null,
    overtime: null,
    status: input.presenceStatus,
  };
}

export function sumHours(days: { actualHours: number; expectedHours: number }[]): {
  actualHours: number;
  expectedHours: number;
} {
  return days.reduce(
    (acc, day) => ({
      actualHours: Math.round((acc.actualHours + day.actualHours) * 100) / 100,
      expectedHours: Math.round((acc.expectedHours + day.expectedHours) * 100) / 100,
    }),
    { actualHours: 0, expectedHours: 0 },
  );
}
