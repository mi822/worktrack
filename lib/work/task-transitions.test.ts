import { describe, expect, it } from "vitest";
import { canTransition } from "@/lib/work/task-transitions";

describe("canTransition", () => {
  it("allows the happy-path lifecycle", () => {
    expect(canTransition("assigned", "in_progress")).toBe(true);
    expect(canTransition("in_progress", "submitted")).toBe(true);
    expect(canTransition("submitted", "under_review")).toBe(true);
    expect(canTransition("under_review", "approved")).toBe(true);
  });

  it("allows approve or reject directly from submitted", () => {
    expect(canTransition("submitted", "approved")).toBe(true);
    expect(canTransition("submitted", "rejected")).toBe(true);
  });

  it("allows reject then resume", () => {
    expect(canTransition("under_review", "rejected")).toBe(true);
    expect(canTransition("rejected", "in_progress")).toBe(true);
  });

  it("blocks unauthorized jumps", () => {
    expect(canTransition("assigned", "approved")).toBe(false);
    expect(canTransition("in_progress", "under_review")).toBe(false);
  });
});
