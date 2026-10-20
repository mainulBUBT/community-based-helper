"use client";

import { useState } from "react";
import { PageTitle, Panel, StatCard } from "@/components/admin/Panel";
import { VisitorChart } from "@/components/admin/VisitorChart";
import { Chip } from "@/components/ui/Chip";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { useAsync } from "@/hooks/useAsync";
import { loadDayStats, loadTopPages } from "@/services/admin/stats";
import { toBnDigits } from "@/utils/format";

const RANGES = [7, 30, 90];

export default function VisitorsPage() {
  const [days, setDays] = useState(30);
  const { data, loading } = useAsync(async () => {
    const [stats, pages] = await Promise.all([loadDayStats(days), loadTopPages(days)]);
    return { stats, pages };
  }, [days]);

  const totals = data?.stats.reduce((sum, s) => ({ views: sum.views + s.views, visitors: sum.visitors + s.visitors }), { views: 0, visitors: 0 });

  return (
    <>
      <PageTitle
        title="ভিজিটর"
        action={
          <div className="flex gap-2">
            {RANGES.map((range) => (
              <Chip key={range} selected={days === range} onClick={() => setDays(range)}>
                {toBnDigits(range)} দিন
              </Chip>
            ))}
          </div>
        }
      />
      {loading || !data || !totals ? (
        <ListSkeleton />
      ) : (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            <StatCard label="মোট পেজ ভিউ" value={toBnDigits(totals.views.toLocaleString("en-IN"))} />
            <StatCard label="দৈনিক ভিজিটরের যোগফল" value={toBnDigits(totals.visitors.toLocaleString("en-IN"))} />
            <StatCard label="দিনে গড় ভিজিটর" value={toBnDigits(Math.round(totals.visitors / Math.max(1, data.stats.length)))} tone="brand" />
          </div>
          <Panel title="দিন অনুযায়ী">
            <div className="p-5">
              <VisitorChart stats={data.stats} />
            </div>
          </Panel>
          <Panel title="কোন পেজ বেশি দেখা হয়েছে">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px] text-left text-[15px]">
                <thead className="text-[13px] text-dim">
                  <tr>
                    <th className="px-5 py-3 font-semibold">পেজ</th>
                    <th className="px-3 py-3 font-semibold">ভিউ</th>
                    <th className="px-5 py-3 font-semibold">ভিজিটর</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line-soft">
                  {data.pages.map((page) => (
                    <tr key={page.path}>
                      <td className="px-5 py-3">
                        <a href={page.path} target="_blank" className="font-semibold hover:text-brand">
                          {page.path}
                        </a>
                      </td>
                      <td className="px-3 py-3">{toBnDigits(page.views)}</td>
                      <td className="px-5 py-3">{toBnDigits(page.visitors)}</td>
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
