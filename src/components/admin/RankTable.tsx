import type { ReactNode } from "react";
import { useAdminI18n } from "@/hooks/useAdminI18n";

interface Row {
  key: string;
  label: ReactNode;
  views: number;
  visitors: number;
}

// ভিজিটর পেজের ছোট তালিকাগুলো: নাম, কতবার, কতজন
export function RankTable({ rows, countLabel }: { rows: Row[]; countLabel?: string }) {
  const { t, num } = useAdminI18n();
  if (!rows.length) return <p className="px-5 py-4 text-sm text-dim">{t.admin.visitors.noData}</p>;
  return (
    <table className="w-full text-left text-sm">
      <thead className="text-[13px] text-dim">
        <tr>
          <th className="px-5 py-2 font-semibold">{t.admin.visitors.colName}</th>
          <th className="px-3 py-2 text-right font-semibold">{countLabel ?? t.admin.visitors.colViews}</th>
          <th className="px-5 py-2 text-right font-semibold">{t.admin.visitors.colVisitors}</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-line-soft">
        {rows.map((row) => (
          <tr key={row.key}>
            <td className="max-w-0 truncate px-5 py-2">{row.label}</td>
            <td className="px-3 py-2 text-right tabular-nums">{num(row.views)}</td>
            <td className="px-5 py-2 text-right tabular-nums">{num(row.visitors)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
