import { describe, expect, it } from "vitest";
import { deadlineState } from "@/lib/work/deadline";

describe("deadlineState", () => {
  it("marks approved tasks completed", () => {
    expect(deadlineState("2026-01-01", "approved", "2026-09-17")).toBe(
      "completed",
    );
  });

  it("marks past incomplete deadlines overdue", () => {
    expect(deadlineState("2026-09-01", "in_progress", "2026-09-17")).toBe(
      "overdue",
    );
  });

  it("marks approaching deadlines due soon", () => {
    expect(deadlineState("2026-09-18", "assigned", "2026-09-17")).toBe(
      "due_soon",
    );
  });

  it("marks future deadlines on time", () => {
    expect(deadlineState("2026-10-01", "assigned", "2026-09-17")).toBe(
      "on_time",
    );
  });
});
