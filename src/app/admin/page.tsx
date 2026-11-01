"use client";

import { AlertCircle, CheckCircle2, ChevronRight } from "lucide-react";
import Link from "next/link";
import { PageTitle, Panel, StatCard } from "@/components/admin/Panel";
import { VisitorChart } from "@/components/admin/VisitorChart";
import { ErrorNotice } from "@/components/ui/ErrorNotice";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { useAsync } from "@/hooks/useAsync";
import { useAdminI18n } from "@/hooks/useAdminI18n";
import { listJobs } from "@/services/admin/jobs";
import { aiReady, loadPrivateSettings } from "@/services/admin/settings";
import { loadDashboardCounts, loadDayStats } from "@/services/admin/stats";

async function loadDashboard() {
  const [counts, jobs, stats, settings] = await Promise.all([loadDashboardCounts(), listJobs(), loadDayStats(14), loadPrivateSettings().catch(() => null)]);
  return { counts, jobs, stats, aiReady: Boolean(settings && aiReady(settings)), loadedAt: Date.now() };
}

export default function DashboardPage() {
  const { t, num, ago } = useAdminI18n();
  const { data, loading, error, reload } = useAsync(loadDashboard, []);
  if (error && !data) return <ErrorNotice onRetry={reload} />;
  if (loading || !data) return <ListSkeleton />;
  const { counts, jobs, stats, aiReady, loadedAt } = data;
  const today = stats.at(-1);
  const failing = jobs.filter((j) => j.lastStatus === "failed");
  const STALE_HOURS = 30;
  const stale = (id: string) => {
    const at = jobs.find((j) => j.id === id)?.lastRunAt;
    return at && loadedAt - new Date(at).getTime() > STALE_HOURS * 3600_000 ? at : null;
  };
  // কাজ থেমে থাকা আগে, কারণ তখন বাকি সব সংখ্যাও পুরনো
  const warnings = [
    ...(stale("prices") ? [{ text: t.admin.dashboard.todo.stalePrices(ago(stale("prices")!)), href: "/admin/jobs/" }] : []),
    ...(stale("rebuild") ? [{ text: t.admin.dashboard.todo.staleSite(ago(stale("rebuild")!)), href: "/admin/jobs/" }] : []),
  ];
  const todo = [
    { count: counts.review, text: t.admin.dashboard.todo.review, href: "/admin/review/" },
    { count: failing.length, text: t.admin.dashboard.todo.failing, href: "/admin/jobs/" },
    { count: counts.noPrice, text: t.admin.dashboard.todo.noPrice, href: "/admin/products/" },
    { count: counts.noImage, text: t.admin.dashboard.todo.noImage, href: "/admin/products/" },
    { count: counts.noSpecs, text: t.admin.dashboard.todo.noSpecs, href: "/admin/products/" },
    { count: counts.unverified, text: t.admin.dashboard.todo.unverified, href: "/admin/sellers/" },
    { count: counts.oldModels, text: t.admin.dashboard.todo.oldModels, href: "/admin/products/" },
  ].filter((item) => item.count > 0);

  return (
    <>
      <PageTitle title={t.admin.dashboard.title} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label={t.admin.dashboard.todayVisitors} value={num(today?.visitors ?? 0)} />
        <StatCard label={t.admin.dashboard.pendingReview} value={num(counts.review)} tone="gold" />
        <StatCard label={t.admin.dashboard.unverifiedSellers} value={num(counts.unverified)} />
        <StatCard label={t.admin.dashboard.failingJobs} value={num(failing.length)} tone={failing.length ? "brand" : "ink"} />
      </div>

      <div className="mt-6">
        <Panel title={t.admin.dashboard.attention}>
          {todo.length === 0 && warnings.length === 0 && aiReady ? (
            <p className="flex items-center gap-2 px-5 py-4 text-sm text-ok">
              <CheckCircle2 size={18} aria-hidden="true" />
              {t.admin.dashboard.allGood}
            </p>
          ) : (
            <ul className="divide-y divide-line-soft">
              {warnings.map((item) => (
                <li key={item.text}>
                  <Link href={item.href} className="flex items-center gap-3 px-5 py-3 text-sm font-semibold hover:bg-surface-2">
                    <AlertCircle size={18} className="shrink-0 text-danger" aria-hidden="true" />
                    <span className="flex-1">{item.text}</span>
                    <ChevronRight size={16} className="text-faint" aria-hidden="true" />
                  </Link>
                </li>
              ))}
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
            <VisitorChart stats={stats} days={14} />
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
