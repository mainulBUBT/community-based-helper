"use client";

import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { useEffect, useRef, useState, type PointerEvent } from "react";
import { useI18n } from "@/hooks/useI18n";
import type { PricePoint } from "@/types/catalog";
import { dailyLowest } from "@/utils/catalog";
import { formatTaka } from "@/utils/format";

const DAYS = 30;
const H = 168;
const TOP = 14;
const BOTTOM = 26;
const DAY_MS = 86400000;
const INSET = 7;

function useWidth() {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.round(entry.contentRect.width)));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return { ref, width };
}

function Change({ from, to }: { from: number; to: number }) {
  const { t, num, lang } = useI18n();
  const diff = to - from;
  if (diff === 0) {
    return (
      <span className="flex items-center gap-1 text-sm font-semibold text-dim">
        <Minus size={15} aria-hidden="true" />
        {t.product.chartSame}
      </span>
    );
  }
  const down = diff < 0;
  const Icon = down ? ArrowDownRight : ArrowUpRight;
  return (
    <span className={`flex items-center gap-1 text-sm font-semibold ${down ? "text-ok" : "text-sale"}`}>
      <Icon size={16} aria-hidden="true" />
       {formatTaka(Math.abs(diff), lang)} ({num(Math.round((Math.abs(diff) / from) * 100))}%) {down ? t.product.chartDown : t.product.chartUp}
    </span>
  );
}

export function PriceChart({ history }: { history: PricePoint[] }) {
  const { t, lang } = useI18n();
  const { ref, width } = useWidth();
  const [hover, setHover] = useState<number | null>(null);
  const [now] = useState(() => Date.now());
  const points = dailyLowest(history, DAYS, now);
  if (points.length < 2) return <p className="text-sm text-dim">{t.product.chartEmpty}</p>;

  const prices = points.map((p) => p.price);
  const low = Math.min(...prices);
  const high = Math.max(...prices);
  const first = points[0];
  const last = points[points.length - 1];
  const pad = Math.max((high - low) * 0.15, high * 0.01);
  const yMin = low - pad;
  const yMax = high + pad;
  const x = (day: number) => INSET + (day / DAYS) * (width - INSET * 2);
  const y = (price: number) => TOP + (1 - (price - yMin) / (yMax - yMin)) * (H - TOP - BOTTOM);
  const base = H - BOTTOM;

  const line = points.reduce((d, p, i) => (i === 0 ? `M${x(p.day)},${y(p.price)}` : `${d} H${x(p.day)} V${y(p.price)}`), "") + ` H${x(DAYS)}`;
  const area = `${line} V${base} H${x(first.day)} Z`;
  const dateOf = (day: number) =>
    new Date(now - (DAYS - day) * DAY_MS).toLocaleDateString(lang === "bn" ? "bn-BD" : "en-GB", { day: "numeric", month: "short" });

  const active = hover === null ? null : (points.find((p) => p.day === hover) ?? null);
  const onMove = (event: PointerEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const day = Math.round(((event.clientX - rect.left - INSET) / (rect.width - INSET * 2)) * DAYS);
    setHover(Math.min(last.day, Math.max(first.day, day)));
  };
  const tipLeft = active ? Math.min(Math.max(x(active.day), 56), width - 56) : 0;

  return (
    <figure className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div className="flex flex-col">
          <span className="text-xs font-medium text-dim">{t.product.chartNow}</span>
          <span className="text-xl leading-tight font-bold tracking-tight text-ink">{formatTaka(last.price, lang)}</span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-xs font-medium text-dim">{t.product.chartChange}</span>
          <Change from={first.price} to={last.price} />
        </div>
      </div>

      <div ref={ref} className="relative">
        {width > 0 && (
          <svg
            width={width}
            height={H}
            className="block touch-pan-y select-none"
            role="img"
            aria-label={t.product.chartLabel(formatTaka(first.price, lang), formatTaka(last.price, lang))}
            onPointerMove={onMove}
            onPointerDown={onMove}
            onPointerLeave={() => setHover(null)}
          >
            <defs>
              <linearGradient id="price-area" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="var(--color-brand)" stopOpacity="0.22" />
                <stop offset="100%" stopColor="var(--color-brand)" stopOpacity="0" />
              </linearGradient>
            </defs>
            {[TOP, (TOP + base) / 2, base].map((gy) => (
              <line key={gy} x1="0" x2={width} y1={gy} y2={gy} className="stroke-line-soft" strokeWidth="1" />
            ))}
            {high > low && (
              <>
                <line x1="0" x2={width} y1={y(low)} y2={y(low)} className="stroke-ok" strokeWidth="1" strokeDasharray="4 4" />
                <text x="2" y={y(low) + 14} className="fill-ok text-[11px] font-semibold">
                  {t.product.chartLow} {formatTaka(low, lang)}
                </text>
                <text x="2" y={TOP - 3} className="fill-faint text-[11px]">
                  {formatTaka(high, lang)}
                </text>
              </>
            )}
            <path d={area} fill="url(#price-area)" />
            <path d={line} fill="none" className="stroke-brand" strokeWidth="2" strokeLinejoin="round" />
            {[0, DAYS / 2, DAYS].map((day, i) => (
              <text key={day} x={x(day)} y={H - 6} textAnchor={i === 0 ? "start" : i === 2 ? "end" : "middle"} className="fill-dim text-[11px]">
                {i === 2 ? t.product.today("").trim() : dateOf(day)}
              </text>
            ))}
            {active ? (
              <>
                <line x1={x(active.day)} x2={x(active.day)} y1={TOP} y2={base} className="stroke-dim" strokeWidth="1" strokeDasharray="3 3" />
                <circle cx={x(active.day)} cy={y(active.price)} r="5" className="fill-brand stroke-surface" strokeWidth="2" />
              </>
            ) : (
              <circle cx={x(last.day)} cy={y(last.price)} r="5" className="fill-brand stroke-surface" strokeWidth="2" />
            )}
          </svg>
        )}
        {active && (
          <div
            className="pointer-events-none absolute top-0 flex -translate-x-1/2 flex-col items-center rounded-md border border-line bg-surface px-2.5 py-1.5 text-center shadow-md"
            style={{ left: tipLeft }}
          >
            <span className="text-[11px] text-dim">{active.day === last.day ? t.product.today("").trim() : dateOf(active.day)}</span>
            <span className="text-sm font-bold text-ink">{formatTaka(active.price, lang)}</span>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-[13px]">
        {last.price === low ? (
          <span className="rounded-full bg-ok-soft px-2.5 py-1 font-semibold text-ok">{t.product.chartBestNow}</span>
        ) : last.price === high ? (
          <span className="rounded-full bg-sale-soft px-2.5 py-1 font-semibold text-sale">{t.product.chartAtHigh}</span>
        ) : (
          <span className="rounded-full bg-gold-soft px-2.5 py-1 font-semibold text-gold-text">{t.product.chartAboveLow(formatTaka(last.price - low, lang))}</span>
        )}
        <span className="text-dim">
          {t.product.chartHigh} {formatTaka(high, lang)}
        </span>
      </div>
      <p className="text-[12px] leading-snug text-dim">{t.product.chartNote}</p>
    </figure>
  );
}
