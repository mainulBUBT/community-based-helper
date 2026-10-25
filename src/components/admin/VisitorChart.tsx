"use client";

import { useState, type PointerEvent } from "react";
import { useAdminI18n } from "@/hooks/useAdminI18n";
import { useElementWidth } from "@/hooks/useElementWidth";
import type { DayStat } from "@/types/admin";

const H = 220;
const TOP = 10;
const BOTTOM = 26;
const LEFT = 40;
const DAY_MS = 86400000;

// ডেটাবেস ভিজিট নেই এমন দিন বাদ দেয়; চার্টে সেগুলো শূন্য হিসেবে থাকে
function fillDays(stats: DayStat[], days: number) {
  const byDay = new Map(stats.map((s) => [s.day, s]));
  const today = Date.parse(new Date().toISOString().slice(0, 10));
  const first = Math.min(today - (days - 1) * DAY_MS, ...stats.map((s) => Date.parse(s.day)));
  const list: DayStat[] = [];
  for (let t = first; t <= today; t += DAY_MS) {
    const day = new Date(t).toISOString().slice(0, 10);
    list.push(byDay.get(day) ?? { day, views: 0, visitors: 0 });
  }
  return list;
}

// গোল সংখ্যায় উপরের সীমা (যেমন ২৫০, ৪০০), খুব বেশি ফাঁকা না রেখে
function niceMax(value: number) {
  if (value <= 4) return 4;
  const power = 10 ** Math.floor(Math.log10(value));
  const step = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].find((n) => n * power >= value) ?? 10;
  return step * power;
}

export function VisitorChart({ stats, days = stats.length }: { stats: DayStat[]; days?: number }) {
  const { t, num, lang } = useAdminI18n();
  const { ref, width } = useElementWidth();
  const [hover, setHover] = useState<number | null>(null);
  const points = fillDays(stats, Math.max(days, 2));
  const empty = points.every((p) => p.views === 0);

  const max = niceMax(Math.max(...points.map((p) => p.views)));
  const plotWidth = Math.max(1, width - LEFT - 8);
  const x = (i: number) => LEFT + (points.length === 1 ? plotWidth / 2 : (i / (points.length - 1)) * plotWidth);
  const y = (value: number) => TOP + (1 - value / max) * (H - TOP - BOTTOM);
  const base = H - BOTTOM;
  const line = (value: (p: DayStat) => number) => points.map((p, i) => `${i ? "L" : "M"}${x(i)},${y(value(p))}`).join(" ");
  const area = `${line((p) => p.views)} L${x(points.length - 1)},${base} L${x(0)},${base} Z`;

  const date = (day: string, long = false) =>
    new Date(day).toLocaleDateString(lang === "bn" ? "bn-BD" : "en-GB", { day: "numeric", month: "short", ...(long && { weekday: "short" }), timeZone: "UTC" });
  const ticks = [0, max / 2, max];
  const labelEvery = Math.max(1, Math.ceil(points.length / Math.max(2, Math.floor(plotWidth / 70))));
  const shown = points[hover ?? points.length - 1];

  const onMove = (event: PointerEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const i = Math.round(((event.clientX - rect.left - LEFT) / plotWidth) * (points.length - 1));
    setHover(Math.min(points.length - 1, Math.max(0, i)));
  };

  return (
    <figure className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-[13px]">
        <span>
          <span className="text-dim">{hover === null ? t.admin.chart.today : date(shown.day, true)}: </span>
          <strong className="text-ink">{t.admin.chart.tooltip(num(shown.visitors), num(shown.views))}</strong>
        </span>
        <span className="flex items-center gap-4 text-xs text-dim">
          <span className="flex items-center gap-1.5">
            <span className="h-0.5 w-4 rounded-full bg-brand" aria-hidden="true" />
            {t.admin.chart.visitors}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-4 rounded-sm bg-brand/15" aria-hidden="true" />
            {t.admin.chart.views}
          </span>
        </span>
      </div>
      <div ref={ref} className="relative">
        {width > 0 && (
          <svg
            width={width}
            height={H}
            className="block touch-pan-y select-none"
            role="img"
            aria-label={t.admin.chart.aria(num(points.length))}
            onPointerMove={onMove}
            onPointerDown={onMove}
            onPointerLeave={() => setHover(null)}
          >
            {ticks.map((tick) => (
              <g key={tick}>
                <line x1={LEFT} x2={width - 8} y1={y(tick)} y2={y(tick)} className="stroke-line-soft" strokeWidth="1" />
                <text x={LEFT - 8} y={y(tick) + 4} textAnchor="end" className="fill-dim text-[11px] tabular-nums">
                  {num(tick)}
                </text>
              </g>
            ))}
            {!empty && (
              <>
                <path d={area} className="fill-brand" fillOpacity="0.12" />
                <path d={line((p) => p.visitors)} fill="none" className="stroke-brand" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
              </>
            )}
            {points.map(
              (p, i) =>
                (i % labelEvery === 0 || i === points.length - 1) &&
                (i === points.length - 1 || points.length - 1 - i >= labelEvery) && (
                  <text key={p.day} x={x(i)} y={H - 6} textAnchor={i === 0 ? "start" : i === points.length - 1 ? "end" : "middle"} className="fill-dim text-[11px]">
                    {date(p.day)}
                  </text>
                ),
            )}
            {hover !== null && !empty && (
              <>
                <line x1={x(hover)} x2={x(hover)} y1={TOP} y2={base} className="stroke-dim" strokeWidth="1" />
                <circle cx={x(hover)} cy={y(shown.visitors)} r="4.5" className="fill-brand stroke-surface" strokeWidth="2" />
              </>
            )}
          </svg>
        )}
        {empty && width > 0 && <p className="absolute inset-x-0 top-1/2 -translate-y-1/2 text-center text-sm text-dim">{t.admin.chart.empty}</p>}
      </div>
      <details className="text-[13px]">
        <summary className="cursor-pointer font-semibold text-brand-text">{t.admin.chart.table}</summary>
        <table className="mt-2 w-full text-left">
          <thead className="text-xs text-dim">
            <tr>
              <th className="py-1 font-semibold">{t.admin.chart.colDay}</th>
              <th className="py-1 text-right font-semibold">{t.admin.chart.visitors}</th>
              <th className="py-1 text-right font-semibold">{t.admin.chart.views}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line-soft">
            {[...points].reverse().map((p) => (
              <tr key={p.day}>
                <td className="py-1.5">{date(p.day, true)}</td>
                <td className="py-1.5 text-right tabular-nums">{num(p.visitors)}</td>
                <td className="py-1.5 text-right tabular-nums">{num(p.views)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
