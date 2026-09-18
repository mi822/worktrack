import { describe, expect, it } from "vitest";
import {
  attendanceAvailability,
  attendanceDayKind,
  canActivateAttendance,
  canRecordAttendance,
  presenceStatusFromClock,
} from "@/lib/presence/attendance-pure";

describe("presenceStatusFromClock", () => {
  it("marks on-time arrival as present", () => {
    expect(presenceStatusFromClock(7 * 60 + 50, 8 * 60, 0)).toBe("present");
  });

  it("marks arrival after the late threshold as late", () => {
    expect(presenceStatusFromClock(8 * 60 + 15, 8 * 60, 0)).toBe("late");
  });

  it("keeps the existing grace window as present", () => {
    expect(presenceStatusFromClock(8 * 60 + 10, 8 * 60, 15)).toBe("present");
  });
});

describe("attendance roles", () => {
  it("allows only admin to activate or close", () => {
    expect(canActivateAttendance("admin")).toBe(true);
    expect(canActivateAttendance("manager")).toBe(false);
    expect(canActivateAttendance("employee")).toBe(false);
  });

  it("allows scanner roles to record and blocks admin", () => {
    expect(canRecordAttendance("employee")).toBe(true);
    expect(canRecordAttendance("intern")).toBe(true);
    expect(canRecordAttendance("manager")).toBe(true);
    expect(canRecordAttendance("project_head")).toBe(true);
    expect(canRecordAttendance("admin")).toBe(false);
  });
});

describe("attendanceAvailability", () => {
  it("blocks recording when the admin has not opened the day", () => {
    expect(
      attendanceAvailability({
        hoursConfigured: true,
        isWorkDay: true,
        dayKind: "inactive",
      }),
    ).toBe("inactive");
  });

  it("blocks recording after the admin closes the day", () => {
    expect(
      attendanceAvailability({
        hoursConfigured: true,
        isWorkDay: true,
        dayKind: "closed",
      }),
    ).toBe("closed");
  });

  it("allows recording only on an open working day", () => {
    expect(
      attendanceAvailability({
        hoursConfigured: true,
        isWorkDay: true,
        dayKind: "active",
      }),
    ).toBe("active");
  });
});

describe("attendanceDayKind", () => {
  it("treats a missing row as inactive", () => {
    expect(attendanceDayKind(null)).toBe("inactive");
  });
});
