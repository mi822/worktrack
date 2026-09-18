import { describe, expect, it } from "vitest";
import { computeTimesheetDay } from "@/lib/timesheet/hours";

describe("computeTimesheetDay", () => {
  it("counts a full day from start when the scan is on time", () => {
    const result = computeTimesheetDay({
      workStart: "09:00",
      workEnd: "17:00",
      breakStart: "12:00",
      breakEnd: "13:00",
      scannedMinutes: 9 * 60,
      presenceStatus: "present",
      lateThresholdMinutes: 15,
    });
    expect(result.expectedHours).toBe(7);
    expect(result.actualHours).toBe(7);
    expect(result.overtime).toBeNull();
    expect(result.earlyDeparture).toBeNull();
  });

  it("returns absent hours as zero", () => {
    const result = computeTimesheetDay({
      workStart: "09:00",
      workEnd: "17:00",
      breakStart: null,
      breakEnd: null,
      scannedMinutes: null,
      presenceStatus: null,
      lateThresholdMinutes: 15,
    });
    expect(result.status).toBe("absent");
    expect(result.actualHours).toBe(0);
    expect(result.expectedHours).toBe(8);
  });

  it("does not bill time after the configured end", () => {
    const result = computeTimesheetDay({
      workStart: "09:00",
      workEnd: "17:00",
      breakStart: null,
      breakEnd: null,
      scannedMinutes: 18 * 60,
      presenceStatus: "late",
      lateThresholdMinutes: 15,
    });
    expect(result.actualHours).toBe(0);
    expect(result.lateMinutes).toBe(9 * 60);
  });
});
