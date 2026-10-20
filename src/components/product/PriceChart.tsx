"use client";

import { useI18n } from "@/hooks/useI18n";
import type { PricePoint } from "@/types/catalog";
import { dailyLowest } from "@/utils/catalog";
import { formatTaka } from "@/utils/format";

const W = 340;
const H = 110;
const PAD = 10;

export function PriceChart({ history }: { history: PricePoint[] }) {
  const { t } = useI18n();
  const points = dailyLowest(history);
  if (points.length < 2) return null;
  const prices = points.map((p) => p.price);
  const min = Math.min(...prices);
  const span = Math.max(...prices) - min || 1;
  const x = (day: number) => (day / 30) * W;
  const y = (price: number) => PAD + (1 - (price - min) / span) * (H - PAD * 2);
  const line = points.map((p) => `${x(p.day).toFixed(1)},${y(p.price).toFixed(1)}`).join(" ");
  const first = formatTaka(points[0].price);
  const last = points[points.length - 1];

  return (
    <figure className="flex flex-col gap-2">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-28 w-full" role="img" aria-label={t.product.chartLabel(first, formatTaka(last.price))}>
        {[PAD, H / 2, H - PAD].map((lineY) => (
          <line key={lineY} x1="0" x2={W} y1={lineY} y2={lineY} className="stroke-line-soft" />
        ))}
        <polyline points={line} fill="none" className="stroke-brand" strokeWidth="2.5" strokeLinejoin="round" />
        <circle cx={x(last.day)} cy={y(last.price)} r="4.5" className="fill-brand" />
      </svg>
      <figcaption className="flex justify-between text-xs text-dim">
        <span>{t.product.monthAgo(first)}</span>
        <span>{t.product.today(formatTaka(last.price))}</span>
      </figcaption>
    </figure>
  );
}
