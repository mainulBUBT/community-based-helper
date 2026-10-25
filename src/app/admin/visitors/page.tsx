"use client";

import { useState } from "react";
import { PageTitle, Panel, StatCard } from "@/components/admin/Panel";
import { RankTable } from "@/components/admin/RankTable";
import { VisitorChart } from "@/components/admin/VisitorChart";
import { Chip } from "@/components/ui/Chip";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { useAsync } from "@/hooks/useAsync";
import { useAdminI18n } from "@/hooks/useAdminI18n";
import { loadDayStats, loadInsights, loadTopPages } from "@/services/admin/stats";
import type { Breakdown } from "@/types/admin";
import { safeUrl } from "@/utils/url";

const RANGES = [7, 30, 90];

const flag = (code: string) => String.fromCodePoint(...[...code].map((c) => 0x1f1a5 + c.charCodeAt(0)));

export default function VisitorsPage() {
  const { t, num, lang } = useAdminI18n();
  const [days, setDays] = useState(30);
  const { data, loading } = useAsync(async () => {
    const [stats, pages, insights] = await Promise.all([loadDayStats(days), loadTopPages(days), loadInsights(days)]);
    return { stats, pages, insights };
  }, [days]);

  const totals = data?.stats.reduce((sum, s) => ({ views: sum.views + s.views, visitors: sum.visitors + s.visitors }), { views: 0, visitors: 0 });
  const countryName = (code: string | null) => {
    if (!code) return t.admin.visitors.unknown;
    try {
      return `${flag(code)} ${new Intl.DisplayNames([lang], { type: "region" }).of(code) ?? code}`;
    } catch {
      return code;
    }
  };
  const rows = (items: Breakdown[], label: (key: string | null) => string) => items.map((item) => ({ key: item.key ?? "-", label: label(item.key), views: item.views, visitors: item.visitors }));

  return (
    <>
      <PageTitle
        title={t.admin.visitors.title}
        subtitle={t.admin.visitors.howCounted}
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
      {loading || !data || !totals ? (
        <ListSkeleton />
      ) : (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard label={t.admin.visitors.totalViews} value={num(totals.views.toLocaleString("en-IN"))} />
            <StatCard label={t.admin.visitors.uniqueVisitors} value={num(data.insights.visitors.toLocaleString("en-IN"))} />
            <StatCard label={t.admin.visitors.returning} value={num(data.insights.returning.toLocaleString("en-IN"))} hint={t.admin.visitors.returningHint} />
            <StatCard label={t.admin.visitors.avgVisitors} value={num(Math.round(totals.visitors / Math.max(1, data.stats.length)))} tone="brand" />
          </div>
          <Panel title={t.admin.visitors.byDay}>
            <div className="p-5">
              <VisitorChart stats={data.stats} />
            </div>
          </Panel>
          <div className="grid gap-6 lg:grid-cols-2">
            <Panel title={t.admin.visitors.products}>
              <RankTable
                rows={data.insights.products.map((p) => ({
                  key: p.slug,
                  label: (
                    <a href={`/product/${p.slug}/`} target="_blank" rel="noopener noreferrer" className="font-semibold hover:text-brand">
                      {p.key}
                    </a>
                  ),
                  views: p.views,
                  visitors: p.visitors,
                }))}
              />
            </Panel>
            <Panel title={t.admin.visitors.searches}>
              <RankTable rows={rows(data.insights.searches, (q) => q ?? "")} countLabel={t.admin.visitors.colTimes} />
            </Panel>
            <Panel title={t.admin.visitors.countries}>
              <RankTable rows={rows(data.insights.countries, countryName)} />
            </Panel>
            <Panel title={t.admin.visitors.devices}>
              <RankTable rows={rows(data.insights.devices, (d) => (d ? t.admin.visitors.device[d as keyof typeof t.admin.visitors.device] ?? d : t.admin.visitors.unknown))} />
            </Panel>
            <Panel title={t.admin.visitors.referrers}>
              <p className="border-b border-line-soft px-5 py-2 text-xs text-dim">{t.admin.visitors.referrersHint}</p>
              <RankTable rows={rows(data.insights.referrers, (r) => r ?? "")} />
            </Panel>
          </div>
          <Panel title={t.admin.visitors.topPages}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px] text-left text-[15px]">
                <thead className="text-[13px] text-dim">
                  <tr>
                    <th className="px-5 py-3 font-semibold">{t.admin.visitors.colPage}</th>
                    <th className="px-3 py-3 font-semibold">{t.admin.visitors.colViews}</th>
                    <th className="px-5 py-3 font-semibold">{t.admin.visitors.colVisitors}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line-soft">
                  {data.pages.map((page) => (
                    <tr key={page.path}>
                      <td className="px-5 py-3">
                        {safeUrl(page.path, { relative: true }) ? (
                          <a href={page.path} target="_blank" rel="noopener noreferrer" className="font-semibold hover:text-brand">
                            {page.path}
                          </a>
                        ) : (
                          <span className="font-semibold text-dim">{page.path}</span>
                        )}
                      </td>
                      <td className="px-3 py-3">{num(page.views)}</td>
                      <td className="px-5 py-3">{num(page.visitors)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>
      )}
    </>
  );
}
