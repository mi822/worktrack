import { PerformanceReviewForm } from "@/app/performance/review-form";
import { AppShell } from "@/components/app-shell";
import { EmptyNote, Stat, StatGrid } from "@/components/dashboard/ui";
import { requirePerformanceAccess } from "@/lib/auth";
import { formatDate, formatDateTime } from "@/lib/format-date";
import {
  canViewPerformance,
  getPerformanceReport,
  hasPerformanceActivity,
} from "@/lib/performance/queries";
import { ROLE_LABEL } from "@/lib/roles";
import { isUuid } from "@/lib/work/parse";
import Link from "next/link";
import { notFound } from "next/navigation";

function percent(value: number) {
  return `${Math.round(value * 100)}%`;
}

export default async function PerformanceDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ userId: string }>;
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const profile = await requirePerformanceAccess();
  const { userId } = await params;
  if (!isUuid(userId) || !(await canViewPerformance(profile, userId))) {
    notFound();
  }

  const report = await getPerformanceReport(userId);
  if (!report) {
    notFound();
  }

  const query = await searchParams;
  const error = query.error?.trim() ? query.error : null;
  const saved = query.saved === "1";
  const canReview =
    (profile.role === "manager" || profile.role === "project_head") &&
    profile.id !== userId;
  const hasActivity = hasPerformanceActivity(report);

  return (
    <AppShell profile={profile}>
      <p className="field-caption">{ROLE_LABEL[profile.role]}</p>
      <h1 className="page-title mt-1">{report.subject.full_name}</h1>
      <p className="mt-2 text-sm text-muted">
        {ROLE_LABEL[report.subject.role]} · {formatDate(report.periodStart)} –{" "}
        {formatDate(report.periodEnd)}
      </p>
      <p className="mt-4 text-sm">
        <Link
          href="/performance"
          className="text-muted underline-offset-2 hover:text-ink hover:underline"
        >
          Back to performance
        </Link>
      </p>

      {error ? <p className="alert-error mt-6">{error}</p> : null}
      {saved ? (
        <p className="mt-6 rounded-lg border border-line bg-canvas px-3 py-2 text-sm text-ink">
          Review saved.
        </p>
      ) : null}

      <section className="panel mt-8 p-6">
        {!hasActivity ? (
          <EmptyNote title="No performance data yet">
            Scores appear after this person has tasks, presence, or participation
            in the period.
          </EmptyNote>
        ) : (
          <>
            <StatGrid>
              <Stat label="Overall" value={report.breakdown.score} tone="action" />
              <Stat label="Assigned tasks" value={report.assigned} />
              <Stat label="Approved" value={report.approved} tone="ok" />
              <Stat label="Rejected" value={report.rejected} tone="bad" />
              <Stat label="On time" value={report.onTimeApproved} />
              <Stat
                label="Attendance days"
                value={`${report.scannedDays} / ${report.expectedDays}`}
              />
              <Stat
                label="Participation days"
                value={`${report.participationDays} / ${report.expectedDays}`}
              />
            </StatGrid>
            <dl className="mt-6 grid gap-2 text-sm min-[480px]:grid-cols-2">
              <div>
                <dt className="field-caption">Completion</dt>
                <dd className="font-semibold text-action">{percent(report.breakdown.completion)}</dd>
              </div>
              <div>
                <dt className="field-caption">Timeliness</dt>
                <dd className="font-semibold text-sky">{percent(report.breakdown.ontime)}</dd>
              </div>
              <div>
                <dt className="field-caption">Attendance</dt>
                <dd className="font-semibold text-teal">{percent(report.breakdown.attendance)}</dd>
              </div>
              <div>
                <dt className="field-caption">Quality</dt>
                <dd className="font-semibold text-ok">{percent(report.breakdown.quality)}</dd>
              </div>
              <div>
                <dt className="field-caption">Participation</dt>
                <dd className="font-semibold text-mark">{percent(report.breakdown.participation)}</dd>
              </div>
            </dl>
          </>
        )}
      </section>

      {canReview ? (
        <section className="panel mt-6 p-6">
          <h2 className="text-sm font-semibold tracking-tight">Add a review</h2>
          <PerformanceReviewForm subjectId={userId} />
        </section>
      ) : null}

      <section className="panel mt-6 p-6">
        <h2 className="text-sm font-semibold tracking-tight">History</h2>
        {report.reviews.length === 0 ? (
          <div className="mt-4">
            <EmptyNote>No written reviews yet.</EmptyNote>
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-line">
            {report.reviews.map((review) => (
              <li key={review.id} className="py-4 first:pt-0 last:pb-0">
                <p className="text-sm font-medium text-ink">
                  {review.reviewer_name} · {review.rating}/5
                </p>
                <p className="mt-1 text-sm text-ink">{review.comments}</p>
                <p className="mt-1 text-xs text-muted">
                  {formatDateTime(review.created_at)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </AppShell>
  );
}
