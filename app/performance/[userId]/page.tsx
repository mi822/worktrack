import { PerformanceReviewForm } from "@/app/performance/review-form";
import { AppShell } from "@/components/app-shell";
import {
  BackLink,
  EmptyNote,
  PageHeader,
  SectionHeader,
  Stat,
  StatGrid,
} from "@/components/dashboard/ui";
import { requirePerformanceAccess } from "@/lib/auth";
import { formatDate, formatDateTime } from "@/lib/format-date";
import {
  canViewPerformance,
  getPerformanceReport,
  hasPerformanceActivity,
} from "@/lib/performance/queries";
import { ROLE_LABEL } from "@/lib/roles";
import { isUuid } from "@/lib/work/parse";
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
      <BackLink href="/performance">Back to performance</BackLink>
      <PageHeader
        icon="user"
        caption={ROLE_LABEL[report.subject.role]}
        title={report.subject.full_name}
        description={`${formatDate(report.periodStart)} – ${formatDate(report.periodEnd)}`}
      />

      {error ? <p className="alert-error mt-6">{error}</p> : null}
      {saved ? (
        <p className="mt-6 rounded-xl border border-line bg-white px-4 py-3 text-sm text-ink">
          Review saved.
        </p>
      ) : null}

      <section className="panel mt-6 p-5 sm:p-6">
        <SectionHeader icon="/performance" title="Score" description="How the overall score is built" />
        {!hasActivity ? (
          <EmptyNote title="No performance data yet">
            Scores appear after this person has tasks, presence, or participation
            in the period.
          </EmptyNote>
        ) : (
          <>
            <StatGrid>
              <Stat label="Overall" value={report.breakdown.score} tone="action" icon="/performance" />
              <Stat label="Assigned tasks" value={report.assigned} tone="action" icon="/tasks" />
              <Stat label="Approved" value={report.approved} tone="ok" icon="check" />
              <Stat label="Rejected" value={report.rejected} tone="bad" />
              <Stat label="On time" value={report.onTimeApproved} tone="ok" icon="/timesheet" />
              <Stat
                label="Attendance days"
                value={`${report.scannedDays} / ${report.expectedDays}`}
                tone="action"
                icon="/attendance"
              />
              <Stat
                label="Participation days"
                value={`${report.participationDays} / ${report.expectedDays}`}
                tone="violet"
                icon="/surveys"
              />
            </StatGrid>
            <dl className="mt-6 grid gap-3 text-sm min-[480px]:grid-cols-2 xl:grid-cols-5 [&>div]:rounded-2xl [&>div]:border [&>div]:border-line/70 [&>div]:p-4">
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
        <section className="panel mt-6 p-5 sm:p-6">
          <SectionHeader icon="/surveys" title="Add a review" description="Rate and comment on this person's work" />
          <PerformanceReviewForm subjectId={userId} />
        </section>
      ) : null}

      <section className="panel mt-6 p-5 sm:p-6">
        <SectionHeader icon="/timesheet" title="History" description="Written reviews" />
        {report.reviews.length === 0 ? (
          <EmptyNote>No written reviews yet.</EmptyNote>
        ) : (
          <ul className="card-list">
            {report.reviews.map((review) => (
              <li key={review.id} className="card-row">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink">
                    {review.reviewer_name} · {review.rating}/5
                  </p>
                  <p className="mt-1 text-sm text-ink-soft">{review.comments}</p>
                  <p className="mt-1 text-xs text-muted">
                    {formatDateTime(review.created_at)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </AppShell>
  );
}
