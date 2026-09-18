import type { AppRole } from "@/lib/types";
import type {
  PerformanceBreakdown,
  PerformanceWeights,
} from "@/lib/performance/score";

export type PerformanceSubject = {
  id: string;
  full_name: string;
  role: Extract<AppRole, "employee" | "intern">;
};

export type PerformanceReviewRow = {
  id: number;
  subject_id: string;
  reviewer_id: string;
  reviewer_name: string;
  period_start: string;
  period_end: string;
  rating: number;
  comments: string;
  created_at: string;
};

export type PerformanceReport = {
  subject: PerformanceSubject;
  periodStart: string;
  periodEnd: string;
  weights: PerformanceWeights;
  breakdown: PerformanceBreakdown;
  assigned: number;
  approved: number;
  onTimeApproved: number;
  rejected: number;
  scannedDays: number;
  expectedDays: number;
  participationDays: number;
  reviews: PerformanceReviewRow[];
};
