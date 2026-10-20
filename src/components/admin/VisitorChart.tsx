import type { DayStat } from "@/types/admin";
import { toBnDigits } from "@/utils/format";

export function VisitorChart({ stats }: { stats: DayStat[] }) {
  const max = Math.max(1, ...stats.map((s) => s.views));
  return (
    <div className="flex flex-col gap-2">
      <div className="flex h-44 items-end gap-1.5" role="img" aria-label={`গত ${toBnDigits(stats.length)} দিনের ভিজিট`}>
        {stats.map((s) => (
          <div key={s.day} className="group relative flex h-full flex-1 flex-col justify-end gap-0.5">
            <div className="flex flex-col justify-end rounded-t-md bg-brand/25" style={{ height: `${(s.views / max) * 100}%` }}>
              <div className="rounded-t-md bg-brand" style={{ height: `${(s.visitors / Math.max(1, s.views)) * 100}%` }} />
            </div>
            <span className="pointer-events-none absolute -top-8 left-1/2 hidden -translate-x-1/2 rounded-md bg-ink px-2 py-1 text-xs whitespace-nowrap text-page group-hover:block">
              {toBnDigits(s.visitors)} জন, {toBnDigits(s.views)} ভিউ
            </span>
          </div>
        ))}
      </div>
      <div className="flex justify-between text-xs text-dim">
        <span>{stats[0]?.day}</span>
        <span className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="size-2.5 rounded-sm bg-brand" /> ভিজিটর
          </span>
          <span className="flex items-center gap-1">
            <span className="size-2.5 rounded-sm bg-brand/25" /> পেজ ভিউ
          </span>
        </span>
        <span>{stats.at(-1)?.day}</span>
      </div>
    </div>
  );
}
