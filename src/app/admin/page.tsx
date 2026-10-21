"use client";

import { AlertCircle, CheckCircle2, ChevronRight } from "lucide-react";
import Link from "next/link";
import { PageTitle, Panel, StatCard } from "@/components/admin/Panel";
import { VisitorChart } from "@/components/admin/VisitorChart";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { useAsync } from "@/hooks/useAsync";
import { useAdminI18n } from "@/hooks/useI18n";
import { listJobs } from "@/services/admin/jobs";
import { listPendingReview } from "@/services/admin/review";
import { listAllSellers } from "@/services/admin/sellers";
import { loadPrivateSettings } from "@/services/admin/settings";
import { listSummaries } from "@/services/catalog";
import { loadDayStats } from "@/services/admin/stats";

async function loadDashboard() {
  const [review, jobs, sellers, stats, summaries, settings] = await Promise.all([
    listPendingReview(),
    listJobs(),
    listAllSellers(),
    loadDayStats(14),
    listSummaries(true),
    loadPrivateSettings().catch(() => null),
  ]);
  return { review, jobs, sellers, stats, summaries, aiReady: Boolean(settings?.llm.baseUrl && settings.llm.model && settings.llm.apiKey) };
}

export default function DashboardPage() {
  const { t, num, ago } = useAdminI18n();
  const { data, loading } = useAsync(loadDashboard, []);
  if (loading || !data) return <ListSkeleton />;
  const { review, jobs, sellers, stats, summaries, aiReady } = data;
  const today = stats.at(-1);
  const failing = jobs.filter((j) => j.lastStatus === "failed");
  const unverified = sellers.filter((s) => !s.verified).length;
  const products = summaries.map((s) => s.product);
  const todo = [
    { count: review.length, text: t.admin.dashboard.todo.review, href: "/admin/review/" },
    { count: failing.length, text: t.admin.dashboard.todo.failing, href: "/admin/jobs/" },
    { count: summaries.filter((s) => s.sellerCount === 0).length, text: t.admin.dashboard.todo.noPrice, href: "/admin/products/" },
    { count: products.filter((p) => !p.images?.length).length, text: t.admin.dashboard.todo.noImage, href: "/admin/products/" },
    { count: products.filter((p) => !p.specs?.length).length, text: t.admin.dashboard.todo.noSpecs, href: "/admin/products/" },
    { count: unverified, text: t.admin.dashboard.todo.unverified, href: "/admin/sellers/" },
  ].filter((item) => item.count > 0);

  return (
    <>
      <PageTitle title={t.admin.dashboard.title} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label={t.admin.dashboard.todayVisitors} value={num(today?.visitors ?? 0)} />
        <StatCard label={t.admin.dashboard.pendingReview} value={num(review.length)} tone="gold" />
        <StatCard label={t.admin.dashboard.unverifiedSellers} value={num(unverified)} />
        <StatCard label={t.admin.dashboard.failingJobs} value={num(failing.length)} tone={failing.length ? "brand" : "ink"} />
      </div>

      <div className="mt-6">
        <Panel title={t.admin.dashboard.attention}>
          {todo.length === 0 && aiReady ? (
            <p className="flex items-center gap-2 px-5 py-4 text-sm text-ok">
              <CheckCircle2 size={18} aria-hidden="true" />
              {t.admin.dashboard.allGood}
            </p>
          ) : (
            <ul className="divide-y divide-line-soft">
              {!aiReady && (
                <li>
                  <Link href="/admin/jobs/" className="flex items-center gap-3 px-5 py-3 text-sm hover:bg-surface-2">
                    <AlertCircle size={18} className="shrink-0 text-gold" aria-hidden="true" />
                    <span className="flex-1">{t.admin.dashboard.todo.noAi}</span>
                    <ChevronRight size={16} className="text-faint" aria-hidden="true" />
                  </Link>
                </li>
              )}
              {todo.map((item) => (
                <li key={item.href + item.count + item.text(num(item.count))}>
                  <Link href={item.href} className="flex items-center gap-3 px-5 py-3 text-sm hover:bg-surface-2">
                    <AlertCircle size={18} className="shrink-0 text-gold" aria-hidden="true" />
                    <span className="flex-1">{item.text(num(item.count))}</span>
                    <ChevronRight size={16} className="text-faint" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
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
                  <span className="truncate font-semibold">{t.admin.jobs.info[job.id as keyof typeof t.admin.jobs.info]?.name ?? job.name}</span>
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
