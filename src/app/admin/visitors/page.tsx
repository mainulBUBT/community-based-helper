"use client";

import { useEffect, useState } from "react";
import { PageTitle, Panel, StatCard } from "@/components/admin/Panel";
import { RankTable } from "@/components/admin/RankTable";
import { Tabs } from "@/components/admin/Tabs";
import { VisitorChart } from "@/components/admin/VisitorChart";
import { Chip } from "@/components/ui/Chip";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { useAsync } from "@/hooks/useAsync";
import { useAdminI18n } from "@/hooks/useAdminI18n";
import { loadDayStats, loadInsights, loadOnline, loadTopPages } from "@/services/admin/stats";
import type { Breakdown } from "@/types/admin";
import { safeUrl } from "@/utils/url";

const RANGES = [7, 30, 90];
const TABS = ["overview", "content", "searches", "audience", "sources"] as const;
type Tab = (typeof TABS)[number];

const flag = (code: string) => String.fromCodePoint(...[...code].map((c) => 0x1f1a5 + c.charCodeAt(0)));

const pageLink = (path: string, label = path) =>
  safeUrl(path, { relative: true }) ? (
    <a href={path} target="_blank" rel="noopener noreferrer" className="font-semibold hover:text-brand">
      {label}
    </a>
  ) : (
    <span className="font-semibold text-dim">{label}</span>
  );

export default function VisitorsPage() {
  const { t, num, lang, ago } = useAdminI18n();
  const [days, setDays] = useState(30);
  const [tab, setTab] = useState<Tab>("overview");
  const { data, loading } = useAsync(async () => {
    const [stats, pages, insights] = await Promise.all([loadDayStats(days), loadTopPages(days), loadInsights(days)]);
    return { stats, pages, insights };
  }, [days]);
  // এখন কে আছেন: প্রতি ৩০ সেকেন্ডে নতুন করে
  const online = useAsync(loadOnline, []);
  const { reload: reloadOnline } = online;
  useEffect(() => {
    const id = setInterval(reloadOnline, 30_000);
    return () => clearInterval(id);
  }, [reloadOnline]);

  const countryName = (code: string | null) => {
    if (!code) return t.admin.visitors.unknown;
    try {
      return `${flag(code)} ${new Intl.DisplayNames([lang], { type: "region" }).of(code) ?? code}`;
    } catch {
      return code;
    }
  };
  const deviceName = (d: string | null) => (d ? (t.admin.visitors.device[d as keyof typeof t.admin.visitors.device] ?? d) : t.admin.visitors.unknown);
  const rows = (items: Breakdown[], label: (key: string | null) => string) => items.map((item) => ({ key: item.key ?? "-", label: label(item.key), views: item.views, visitors: item.visitors }));
  const seeAll = (target: Tab) => (
    <button type="button" onClick={() => setTab(target)} className="text-sm font-semibold text-brand-text hover:underline">
      {t.admin.visitors.seeAll}
    </button>
  );

  const body = () => {
    if (loading || !data) return <ListSkeleton />;
    const { stats, pages, insights } = data;
    const views = stats.reduce((sum, s) => sum + s.views, 0);
    const dailyVisitors = stats.reduce((sum, s) => sum + s.visitors, 0);
    const products = insights.products.map((p) => ({ key: p.slug, label: pageLink(`/product/${p.slug}/`, p.key ?? p.slug), views: p.views, visitors: p.visitors }));
    const countries = rows(insights.countries, countryName);

    switch (tab) {
      case "overview":
        return (
          <>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatCard
                label={t.admin.visitors.totalViews}
                value={num(views.toLocaleString("en-IN"))}
                hint={insights.visitors ? `${t.admin.visitors.perVisitor}: ${num((views / insights.visitors).toFixed(1))}` : undefined}
              />
              <StatCard label={t.admin.visitors.uniqueVisitors} value={num(insights.visitors.toLocaleString("en-IN"))} />
              <StatCard
                label={t.admin.visitors.returning}
                value={num(insights.returning.toLocaleString("en-IN"))}
                hint={insights.visitors ? t.admin.visitors.returningShare(num(Math.round((insights.returning / insights.visitors) * 100))) : t.admin.visitors.returningHint}
              />
              <StatCard label={t.admin.visitors.avgVisitors} value={num(Math.round(dailyVisitors / days))} tone="brand" />
            </div>
            <Panel title={t.admin.visitors.byDay}>
              <div className="p-5">
                <VisitorChart stats={stats} days={days} />
              </div>
            </Panel>
            <div className="grid gap-6 lg:grid-cols-2">
              <Panel title={t.admin.visitors.products} action={products.length > 5 && seeAll("content")}>
                <RankTable rows={products} limit={5} />
              </Panel>
              <Panel title={t.admin.visitors.countries} action={countries.length > 5 && seeAll("audience")}>
                <RankTable rows={countries} limit={5} share />
              </Panel>
            </div>
            <details className="rounded-2xl border border-line-soft bg-surface px-5 py-4 text-sm">
              <summary className="cursor-pointer font-semibold">{t.admin.visitors.howTitle}</summary>
              <p className="mt-2 text-dim">{t.admin.visitors.howCounted}</p>
            </details>
          </>
        );
      case "content":
        return (
          <div className="grid gap-6 xl:grid-cols-2">
            <Panel title={t.admin.visitors.products}>
              <RankTable rows={products} />
            </Panel>
            <Panel title={t.admin.visitors.topPages}>
              <RankTable rows={pages.map((p) => ({ key: p.path, label: pageLink(p.path), views: p.views, visitors: p.visitors }))} />
            </Panel>
          </div>
        );
      case "searches":
        return (
          <Panel title={t.admin.visitors.searches}>
            <RankTable rows={rows(insights.searches, (q) => q ?? "")} countLabel={t.admin.visitors.colTimes} />
          </Panel>
        );
      case "audience":
        return (
          <div className="grid gap-6 lg:grid-cols-2">
            <Panel title={t.admin.visitors.countries}>
              <RankTable rows={countries} share />
            </Panel>
            <Panel title={t.admin.visitors.devices}>
              <RankTable rows={rows(insights.devices, deviceName)} share />
            </Panel>
          </div>
        );
      case "sources":
        return (
          <Panel title={t.admin.visitors.referrers}>
            <p className="border-b border-line-soft px-5 py-3 text-xs text-dim">{t.admin.visitors.referrersHint}</p>
            <RankTable rows={rows(insights.referrers, (r) => r ?? "")} share />
          </Panel>
        );
    }
  };

  return (
    <>
      <PageTitle
        title={t.admin.visitors.title}
        action={
          <div className="flex gap-2">
            {RANGES.map((range) => (
              <Chip key={range} selected={days === range} onClick={() => setDays(range)}>
                {t.admin.visitors.days(num(range))}
              </Chip>
            ))}
          </div>
        }
      />
      <Tabs tabs={TABS.map((id) => ({ id, label: t.admin.visitors.tabs[id] }))} active={tab} onChange={setTab} label={t.admin.visitors.title} idPrefix="visitors" />
      <div role="tabpanel" id={`visitors-${tab}`} className="mt-6 flex flex-col gap-6">
        {body()}
      </div>
      <div className="mt-6">
        <Panel title={t.admin.visitors.online(num(online.data?.length ?? 0))}>
          <p className="border-b border-line-soft px-5 py-3 text-xs text-dim">{t.admin.visitors.onlineHint}</p>
          {online.data?.length ? (
            <ul className="max-h-80 divide-y divide-line-soft overflow-y-auto text-sm">
              {online.data.map((v, i) => (
                <li key={`${v.seenAt}-${i}`} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-5 py-2.5">
                  <span className="min-w-0 truncate">{pageLink(v.path, v.product ?? v.path)}</span>
                  <span className="shrink-0 text-xs text-dim">
                    {countryName(v.country)} · {deviceName(v.device)} · {ago(v.seenAt)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-5 py-4 text-sm text-dim">{online.loading ? t.common.loading : t.admin.visitors.onlineEmpty}</p>
          )}
        </Panel>
      </div>
    </>
  );
}
