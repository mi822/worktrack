import { describe, expect, it } from "vitest";
import { averageRating, responseRate } from "@/lib/surveys/score";

describe("engagement calculations", () => {
  it("averages rating-scale answers", () => {
    expect(averageRating([5, 3, 4])).toBe(4);
  });

  it("returns null when there are no ratings", () => {
    expect(averageRating([])).toBeNull();
  });

  it("computes response rate from real counts", () => {
    expect(responseRate(2, 4)).toBe(0.5);
    expect(responseRate(1, 0)).toBeNull();
  });
});
