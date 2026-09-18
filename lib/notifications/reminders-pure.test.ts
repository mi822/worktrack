import { describe, expect, it } from "vitest";
import {
  isDeadlineApproaching,
  reminderActivityHref,
  reminderTaskHref,
} from "@/lib/notifications/reminders-pure";

describe("deadline reminders", () => {
  it("treats today and two days ahead as approaching", () => {
    expect(isDeadlineApproaching("2026-09-15", "2026-09-15")).toBe(true);
    expect(isDeadlineApproaching("2026-09-17", "2026-09-15")).toBe(true);
    expect(isDeadlineApproaching("2026-09-18", "2026-09-15")).toBe(false);
    expect(isDeadlineApproaching("2026-09-14", "2026-09-15")).toBe(false);
  });

  it("builds stable hrefs so notify_once stays unique", () => {
    expect(reminderTaskHref(12)).toBe("/tasks/12");
    expect(reminderActivityHref("employee")).toBe("/summary");
    expect(reminderActivityHref("intern")).toBe("/learning-log");
  });
});
