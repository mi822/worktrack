import { describe, expect, it } from "vitest";
import {
  computePerformance,
  DEFAULT_PERFORMANCE_WEIGHTS,
} from "@/lib/performance/score";

describe("computePerformance", () => {
  it("returns 0 when every denominator is empty", () => {
    const result = computePerformance({
      assigned: 0,
      approved: 0,
      onTimeApproved: 0,
      rejected: 0,
      scannedDays: 0,
      expectedDays: 0,
      participationDays: 0,
    });
    expect(result.score).toBe(0);
  });

  it("returns 100 for a perfect record", () => {
    const result = computePerformance(
      {
        assigned: 4,
        approved: 4,
        onTimeApproved: 4,
        rejected: 0,
        scannedDays: 10,
        expectedDays: 10,
        participationDays: 10,
      },
      DEFAULT_PERFORMANCE_WEIGHTS,
    );
    expect(result.score).toBe(100);
  });

  it("does not invent a 100% quality rate with no reviews", () => {
    const result = computePerformance({
      assigned: 2,
      approved: 0,
      onTimeApproved: 0,
      rejected: 0,
      scannedDays: 0,
      expectedDays: 5,
      participationDays: 0,
    });
    expect(result.quality).toBe(0);
    expect(result.completion).toBe(0);
  });
});
