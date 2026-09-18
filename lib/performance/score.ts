/**
 * Performance score from live WorkTrack rows (no dummy rates).
 *
 * score = 100 * (
 *   w_completion    * approved / assigned +
 *   w_ontime        * on_time_approved / approved +
 *   w_attendance    * scanned_working_days / expected_working_days +
 *   w_quality       * (1 - rejected / (approved + rejected)) +
 *   w_participation * logs_or_summaries / expected_working_days
 * )
 *
 * Empty denominators contribute 0, not a fabricated 100%.
 * On-time uses the last submission calendar date versus the task deadline.
 * Presence of any status (present or late) counts as attended.
 */

export type PerformanceWeights = {
  w_completion: number;
  w_ontime: number;
  w_attendance: number;
  w_quality: number;
  w_participation: number;
};

export const DEFAULT_PERFORMANCE_WEIGHTS: PerformanceWeights = {
  w_completion: 0.3,
  w_ontime: 0.25,
  w_attendance: 0.25,
  w_quality: 0.1,
  w_participation: 0.1,
};

export type PerformanceInputs = {
  assigned: number;
  approved: number;
  onTimeApproved: number;
  rejected: number;
  scannedDays: number;
  expectedDays: number;
  participationDays: number;
};

export type PerformanceBreakdown = {
  completion: number;
  ontime: number;
  attendance: number;
  quality: number;
  participation: number;
  score: number;
};

function rate(numerator: number, denominator: number): number {
  if (denominator <= 0) {
    return 0;
  }
  return Math.min(1, Math.max(0, numerator / denominator));
}

export function computePerformance(
  input: PerformanceInputs,
  weights: PerformanceWeights = DEFAULT_PERFORMANCE_WEIGHTS,
): PerformanceBreakdown {
  const completion = rate(input.approved, input.assigned);
  const ontime = rate(input.onTimeApproved, input.approved);
  const attendance = rate(input.scannedDays, input.expectedDays);
  const quality = rate(
    input.approved,
    input.approved + input.rejected,
  );
  const participation = rate(input.participationDays, input.expectedDays);
  const score =
    100 *
    (weights.w_completion * completion +
      weights.w_ontime * ontime +
      weights.w_attendance * attendance +
      weights.w_quality * quality +
      weights.w_participation * participation);

  return {
    completion,
    ontime,
    attendance,
    quality,
    participation,
    score: Math.round(score * 10) / 10,
  };
}

export function averageScores(scores: number[]): number | null {
  if (scores.length === 0) {
    return null;
  }
  const sum = scores.reduce((total, value) => total + value, 0);
  return Math.round((sum / scores.length) * 10) / 10;
}
