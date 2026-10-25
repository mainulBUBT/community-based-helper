import type { ReactNode } from "react";
import { useAdminI18n } from "@/hooks/useAdminI18n";

interface Row {
  key: string;
  label: ReactNode;
  views: number;
  visitors: number;
}

// ভিজিটর পেজের তালিকা; অংশ (%) শুধু যেখানে তালিকাটাই প্রায় পুরোটা (দেশ, ডিভাইস)
export function RankTable({ rows, countLabel, limit, share = false }: { rows: Row[]; countLabel?: string; limit?: number; share?: boolean }) {
  const { t, num } = useAdminI18n();
  if (!rows.length) return <p className="px-5 py-6 text-sm text-dim">{t.admin.visitors.noData}</p>;
  const total = rows.reduce((sum, row) => sum + row.views, 0);
  const top = Math.max(1, ...rows.map((row) => row.views));
  const percent = (views: number) => {
    const value = (views / Math.max(1, total)) * 100;
    return value > 0 && value < 1 ? `<${num(1)}%` : `${num(Math.round(value))}%`;
  };
  return (
    <table className="w-full table-fixed text-left text-sm">
      <thead className="text-xs text-dim">
        <tr>
          <th className="w-10 py-2 pl-5 font-semibold">#</th>
          <th className="py-2 pr-3 font-semibold">{t.admin.visitors.colName}</th>
          <th className="w-20 py-2 pr-3 text-right font-semibold">{countLabel ?? t.admin.visitors.colViews}</th>
          <th className={`w-20 py-2 text-right font-semibold ${share ? "pr-3" : "pr-5"}`}>{t.admin.visitors.colVisitors}</th>
          {share && <th className="w-16 py-2 pr-5 text-right font-semibold">{t.admin.visitors.colShare}</th>}
        </tr>
      </thead>
      <tbody className="divide-y divide-line-soft">
        {rows.slice(0, limit).map((row, i) => (
          <tr key={row.key}>
            <td className="py-2.5 pl-5 text-dim tabular-nums">{num(i + 1)}</td>
            <td className="py-2.5 pr-3">
              <div className="truncate">{row.label}</div>
              <div className="mt-1.5 h-1 rounded-full bg-surface-2">
                <div className="h-1 rounded-full bg-brand" style={{ width: `${(row.views / top) * 100}%` }} />
              </div>
            </td>
            <td className="py-2.5 pr-3 text-right font-semibold tabular-nums">{num(row.views)}</td>
            <td className={`py-2.5 text-right tabular-nums ${share ? "pr-3" : "pr-5"}`}>{num(row.visitors)}</td>
            {share && <td className="py-2.5 pr-5 text-right text-dim tabular-nums">{percent(row.views)}</td>}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
