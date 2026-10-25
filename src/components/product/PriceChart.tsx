"use client";

import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from "react";
import { useI18n } from "@/hooks/useI18n";
import type { OfferView, PricePoint } from "@/types/catalog";
import { dailyRange, type DayRange } from "@/utils/catalog";
import { formatTaka } from "@/utils/format";

const DAYS = 30;
const H = 168;
const TOP = 12;
const BOTTOM = 26;
const DAY_MS = 86400000;
const INSET = 8;

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

function Tile({ label, value, note }: { label: string; value: ReactNode; note?: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5 rounded-md border border-line-soft bg-surface-2/40 px-3 py-2.5">
      <span className="text-xs text-dim">{label}</span>
      <span className="text-base leading-tight font-bold tracking-tight text-ink md:text-lg">{value}</span>
      {note && <span className="text-xs break-words text-dim">{note}</span>}
    </div>
  );
}

function changeOf(from: number, to: number) {
  const diff = to - from;
  return { diff, down: diff < 0, percent: Math.round((Math.abs(diff) / from) * 100) };
}

function Change({ from, to }: { from: number; to: number }) {
  const { t, lang } = useI18n();
  const { diff, down } = changeOf(from, to);
  if (diff === 0) {
    return (
      <span className="flex items-center gap-1 text-dim">
        <Minus size={16} aria-hidden="true" />
        {t.product.chartSame}
      </span>
    );
  }
  const Icon = down ? ArrowDownRight : ArrowUpRight;
  return (
    <span className={`flex items-center gap-1 ${down ? "text-ok" : "text-sale"}`}>
      <Icon size={17} aria-hidden="true" />
      {formatTaka(Math.abs(diff), lang)}
    </span>
  );
}

export function PriceChart({ history, offers }: { history: PricePoint[]; offers: OfferView[] }) {
  const { t, num, lang } = useI18n();
  const { ref, width } = useWidth();
  const [hover, setHover] = useState<number | null>(null);
  // বিল্ড-টাইম আর দেখার সময় আলাদা হয় বলে now ডেটা থেকে আসে — না হলে SVG/লেবেল hydration মিসম্যাচ করে।
  const [now] = useState(() => Math.max(0, ...history.map((p) => Date.parse(p.seenAt)), ...offers.map((o) => Date.parse(o.checkedAt))));
  const points = dailyRange(history, offers, DAYS, now);
  if (points.length < 2 || !offers.length) return <p className="text-sm text-dim">{t.product.chartEmpty}</p>;

  const shopOf = (offerId: string) => offers.find((o) => o.id === offerId)?.seller.name ?? "";
  const first = points[0];
  const last = points[points.length - 1];
  const lowest = points.reduce((a, p) => (p.low < a.low ? p : a));
  // উচ্চতা ঠিক হয় সবচেয়ে কম দামের দাগ দেখে, যাতে তার ওঠানামা চোখে পড়ে; অনেক বেশি দামের দোকান হালকা রঙে উপরে কেটে যায়
  const yLow = Math.min(...points.map((p) => p.low));
  const lowTop = Math.max(...points.map((p) => p.low));
  const spread = points.some((p) => p.high > p.low);
  const pad = Math.max((lowTop - yLow) * 0.6, lowTop * 0.02);
  const yHigh = lowTop;
  const x = (day: number) => INSET + (day / DAYS) * (width - INSET * 2);
  const y = (price: number) => TOP + (1 - (price - (yLow - pad)) / (yHigh + pad - (yLow - pad))) * (H - TOP - BOTTOM);
  const base = H - BOTTOM;

  const step = (value: (p: DayRange) => number, list: DayRange[]) =>
    list.reduce((d, p, i) => (i === 0 ? `M${x(p.day)},${y(value(p))}` : `${d} H${x(p.day)} V${y(value(p))}`), "") + ` H${x(DAYS)}`;
  const line = step((p) => p.low, points);
  // প্রতিদিনের জন্য একটা আয়তক্ষেত্র: সেদিনের সবচেয়ে কম থেকে সবচেয়ে বেশি
  const bands = points.map((p, i) => ({ day: p.day, x: x(p.day), w: x(points[i + 1]?.day ?? DAYS) - x(p.day), top: Math.max(TOP, y(p.high)), bottom: y(p.low) }));
  const dateOf = (day: number) =>
    new Date(now - (DAYS - day) * DAY_MS).toLocaleDateString(lang === "bn" ? "bn-BD" : "en-GB", { day: "numeric", month: "short", timeZone: "Asia/Dhaka" });
  const dayLabel = (day: number) => (day === last.day ? t.product.today("").trim() : dateOf(day));
  const change = changeOf(first.low, last.low);
  const changes = points.filter((p, i) => i === 0 || p.low !== points[i - 1].low);

  const active = hover === null ? null : (points.find((p) => p.day === hover) ?? null);
  const onMove = (event: PointerEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const day = Math.round(((event.clientX - rect.left - INSET) / (rect.width - INSET * 2)) * DAYS);
    setHover(Math.min(last.day, Math.max(first.day, day)));
  };
  // ভাসমান বক্সের বদলে চার্টের উপরে এক লাইন: কিছু ঢাকে না, আর hover না থাকলে আজকের দাম
  const shown = active ?? last;

  return (
    <figure className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-2">
        <Tile label={t.product.chartNow} value={formatTaka(last.low, lang)} />
        <Tile label={t.product.chartMonthLow} value={formatTaka(lowest.low, lang)} note={lowest.day === last.day ? t.product.chartBestNow : dayLabel(lowest.day)} />
        <Tile label={t.product.chartChange} value={<Change from={first.low} to={last.low} />} note={change.diff ? `${num(change.percent)}%` : undefined} />
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-[13px]">
          <span className="min-w-0 truncate">
            <span className="text-dim">{dayLabel(shown.day)}: </span>
            <strong className="text-ink">{formatTaka(shown.low, lang)}</strong>
            <span className="text-dim">, {shopOf(shown.lowOfferId)}</span>
          </span>
          <span className="flex shrink-0 items-center gap-3 text-xs text-dim">
            <span className="flex items-center gap-1.5">
              <span className="h-0.5 w-4 rounded-full bg-brand" aria-hidden="true" />
              {t.product.chartLegendLow}
            </span>
            {spread && (
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-4 rounded-sm bg-brand/15" aria-hidden="true" />
                {t.product.chartLegendRange}
              </span>
            )}
          </span>
        </div>
        <div ref={ref}>
          {width > 0 && (
            <svg
              width={width}
              height={H}
              className="block touch-pan-y select-none"
              role="img"
              aria-label={t.product.chartLabel(formatTaka(first.low, lang), formatTaka(last.low, lang))}
              onPointerMove={onMove}
              onPointerDown={onMove}
              onPointerLeave={() => setHover(null)}
            >
              {[TOP, (TOP + base) / 2, base].map((gy) => (
                <line key={gy} x1="0" x2={width} y1={gy} y2={gy} className="stroke-line-soft" strokeWidth="1" />
              ))}
              {spread && bands.map((b) => b.bottom > b.top && <rect key={b.day} x={b.x} y={b.top} width={Math.max(0, b.w)} height={b.bottom - b.top} className="fill-brand" fillOpacity="0.1" />)}
              <path d={line} fill="none" className="stroke-brand" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
              {lowest.day !== last.day && <circle cx={x(lowest.day)} cy={y(lowest.low)} r="4" className="fill-ok stroke-surface" strokeWidth="2" />}
              {[0, DAYS / 2, DAYS].map((day, i) => (
                <text key={day} x={x(day)} y={H - 6} textAnchor={i === 0 ? "start" : i === 2 ? "end" : "middle"} className="fill-dim text-[11px]">
                  {i === 2 ? t.product.today("").trim() : dateOf(day)}
                </text>
              ))}
              {active && <line x1={x(active.day)} x2={x(active.day)} y1={TOP} y2={base} className="stroke-dim" strokeWidth="1" />}
              <circle cx={x(shown.day)} cy={y(shown.low)} r="5" className="fill-brand stroke-surface" strokeWidth="2" />
            </svg>
          )}
        </div>
      </div>

      <details className="text-[13px]">
        <summary className="cursor-pointer font-semibold text-brand-text">{t.product.chartTable}</summary>
        <table className="mt-2 w-full text-left">
          <thead className="text-xs text-dim">
            <tr>
              <th className="py-1 font-semibold">{t.product.chartColDate}</th>
              <th className="py-1 font-semibold">{t.product.chartColPrice}</th>
              <th className="py-1 font-semibold">{t.product.chartColShop}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line-soft">
            {[...changes].reverse().map((p) => (
              <tr key={p.day}>
                <td className="py-1.5">{dayLabel(p.day)}</td>
                <td className="py-1.5 font-semibold text-ink">{formatTaka(p.low, lang)}</td>
                <td className="py-1.5">{shopOf(p.lowOfferId)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
