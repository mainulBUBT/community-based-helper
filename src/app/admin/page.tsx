"use client";

import Link from "next/link";
import { PageTitle, Panel, StatCard } from "@/components/admin/Panel";
import { VisitorChart } from "@/components/admin/VisitorChart";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { useAsync } from "@/hooks/useAsync";
import { useAdminI18n } from "@/hooks/useI18n";
import { listJobs } from "@/services/admin/jobs";
import { listPendingReview } from "@/services/admin/review";
import { listAllSellers } from "@/services/admin/sellers";
import { loadDayStats } from "@/services/admin/stats";

async function loadDashboard() {
  const [review, jobs, sellers, stats] = await Promise.all([listPendingReview(), listJobs(), listAllSellers(), loadDayStats(14)]);
  return { review, jobs, sellers, stats };
}

export default function DashboardPage() {
  const { t, num, ago } = useAdminI18n();
  const { data, loading } = useAsync(loadDashboard, []);
  if (loading || !data) return <ListSkeleton />;
  const { review, jobs, sellers, stats } = data;
  const today = stats.at(-1);
  const failing = jobs.filter((j) => j.lastStatus === "failed");
  const unverified = sellers.filter((s) => !s.verified).length;

  return (
    <>
      <PageTitle title={t.admin.dashboard.title} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label={t.admin.dashboard.todayVisitors} value={num(today?.visitors ?? 0)} />
        <StatCard label={t.admin.dashboard.pendingReview} value={num(review.length)} tone="gold" />
        <StatCard label={t.admin.dashboard.unverifiedSellers} value={num(unverified)} />
        <StatCard label={t.admin.dashboard.failingJobs} value={num(failing.length)} tone={failing.length ? "brand" : "ink"} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <Panel
          title={t.admin.dashboard.lastDays(num(14))}
          action={
            <Link href="/admin/visitors/" className="text-sm font-semibold text-brand">
              {t.admin.common.details}
            </Link>
          }
        >
          <div className="p-5">
            <VisitorChart stats={stats} />
          </div>
        </Panel>
        <Panel
          title={t.admin.dashboard.regularJobs}
          action={
            <Link href="/admin/jobs/" className="text-sm font-semibold text-brand">
              {t.admin.dashboard.allJobs}
            </Link>
          }
        >
          <ul className="divide-y divide-line-soft">
            {jobs.map((job) => (
              <li key={job.id} className="flex items-center justify-between gap-3 px-5 py-3">
                <span className="flex min-w-0 flex-col">
                  <span className="truncate font-semibold">{job.name}</span>
                  <span className="truncate text-[13px] text-dim">{job.lastMessage ?? t.admin.dashboard.neverRan}</span>
                </span>
                <span className={`shrink-0 text-[13px] font-semibold ${job.lastStatus === "failed" ? "text-brand" : "text-dim"}`}>
                  {job.lastRunAt ? ago(job.lastRunAt) : t.admin.dashboard.never}
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </>
  );
}
