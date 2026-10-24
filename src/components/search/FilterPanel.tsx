"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useCategories } from "@/hooks/useCategories";
import { useI18n } from "@/hooks/useI18n";
import type { Axis } from "@/types/catalog";
import { formatTaka } from "@/utils/format";

export interface Filters {
  category: string | null;
  brands: string[];
  min: number | null;
  max: number | null;
  inStock: boolean;
  unofficial: boolean;
  attributes: Partial<Record<Axis, string[]>>;
}

export interface Facets {
  brands: string[];
  axes: { axis: Axis; values: string[] }[];
  priceFloor: number;
  priceCeil: number;
}

type Patch = Record<string, string | null>;

const toggle = (list: string[], value: string) => (list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
const joined = (list: string[]) => (list.length ? list.join(",") : null);

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <details open className="group border-b border-line-soft last:border-b-0">
      <summary className="flex h-12 cursor-pointer list-none items-center justify-between px-4 text-sm font-bold">
        {title}
        <ChevronDown size={16} className="text-dim transition-transform group-open:rotate-180" aria-hidden="true" />
      </summary>
      <div className="flex flex-col gap-2 px-4 pb-4">{children}</div>
    </details>
  );
}

function Check({ checked, onChange, children }: { checked: boolean; onChange: () => void; children: ReactNode }) {
  return (
    <label className="flex min-h-8 cursor-pointer items-center gap-2.5 text-sm">
      <input type="checkbox" checked={checked} onChange={onChange} className="size-4 shrink-0 accent-[var(--color-brand)]" />
      {children}
    </label>
  );
}

function Budget({ filters, facets, update }: { filters: Filters; facets: Facets; update: (patch: Patch) => void }) {
  const { t, lang } = useI18n();
  const [low, setLow] = useState(filters.min ?? facets.priceFloor);
  const [high, setHigh] = useState(filters.max ?? facets.priceCeil);

  useEffect(() => {
    const timer = setTimeout(() => {
      const min = low > facets.priceFloor ? low : null;
      const max = high < facets.priceCeil ? high : null;
      if (min !== filters.min || max !== filters.max) update({ min: min ? String(min) : null, max: max ? String(max) : null });
    }, 450);
    return () => clearTimeout(timer);
  }, [low, high, facets.priceFloor, facets.priceCeil, filters.min, filters.max, update]);

  const span = Math.max(1, facets.priceCeil - facets.priceFloor);
  const step = span > 100000 ? 1000 : 500;
  const slider = "pointer-events-none absolute inset-x-0 top-0 h-1.5 w-full appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-brand [&::-webkit-slider-thumb]:bg-surface [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:size-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-brand [&::-moz-range-thumb]:bg-surface";

  return (
    <>
      <div className="relative mt-2 mb-3 h-1.5 rounded-full bg-line">
        <div
          className="absolute h-1.5 rounded-full bg-brand"
          style={{ left: `${((low - facets.priceFloor) / span) * 100}%`, right: `${100 - ((high - facets.priceFloor) / span) * 100}%` }}
        />
        <input
          type="range"
          aria-label={t.search.min}
          min={facets.priceFloor}
          max={facets.priceCeil}
          step={step}
          value={low}
          onChange={(e) => setLow(Math.min(Number(e.target.value), high))}
          className={slider}
        />
        <input
          type="range"
          aria-label={t.search.max}
          min={facets.priceFloor}
          max={facets.priceCeil}
          step={step}
          value={high}
          onChange={(e) => setHigh(Math.max(Number(e.target.value), low))}
          className={slider}
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: t.search.min, value: low, set: setLow },
          { label: t.search.max, value: high, set: setHigh },
        ].map(({ label, value, set }) => (
          <label key={label} className="flex flex-col rounded-md border border-line px-2.5 py-1.5 focus-within:border-brand">
            <span className="text-[11px] text-dim">{label}</span>
            <input
              inputMode="numeric"
              value={formatTaka(value, lang)}
              onChange={(e) => set(Number(e.target.value.replace(/\D/g, "")) || 0)}
              className="w-full bg-transparent text-sm font-semibold outline-none"
            />
          </label>
        ))}
      </div>
    </>
  );
}

export function FilterPanel({ filters, facets, update }: { filters: Filters; facets: Facets; update: (patch: Patch) => void }) {
  const { t, lang } = useI18n();
  const { top, childrenOf, name } = useCategories();
  const slugs = top.flatMap((c) => [{ slug: c.slug, child: false }, ...childrenOf(c.slug).map((x) => ({ slug: x.slug, child: true }))]);
  const resetAxes = Object.fromEntries(facets.axes.map(({ axis }) => [axis, null]));
  return (
    <div className="flex flex-col">
      <Section title={t.search.category}>
        {[{ slug: null, child: false }, ...slugs].map(({ slug, child }) => (
          <label key={slug ?? "all"} className={`flex min-h-8 cursor-pointer items-center gap-2.5 text-sm ${child ? "pl-6" : ""}`}>
            <input
              type="radio"
              name="category"
              checked={filters.category === slug}
              onChange={() => update({ ...resetAxes, category: slug, brand: null })}
              className="size-4 accent-[var(--color-brand)]"
            />
            {slug ? name(slug) : t.search.all}
          </label>
        ))}
      </Section>

      {facets.priceCeil > facets.priceFloor && (
        <Section title={t.search.budget}>
          <Budget key={`${filters.min}-${filters.max}-${facets.priceFloor}-${facets.priceCeil}`} filters={filters} facets={facets} update={update} />
        </Section>
      )}

      {facets.brands.length > 0 && (
        <Section title={t.search.brand}>
          {facets.brands.map((b) => (
            <Check key={b} checked={filters.brands.includes(b)} onChange={() => update({ brand: joined(toggle(filters.brands, b)) })}>
              {b}
            </Check>
          ))}
        </Section>
      )}

      <Section title={t.search.availability}>
        <Check checked={filters.inStock} onChange={() => update({ stock: filters.inStock ? null : "1" })}>
          {t.search.inStock}
        </Check>
      </Section>

      <Section title={t.search.type}>
        <Check checked={filters.unofficial} onChange={() => update({ unofficial: filters.unofficial ? null : "1" })}>
          {t.search.unofficialToo}
        </Check>
      </Section>

      {facets.axes.map(({ axis, values }) => {
        const selected = filters.attributes[axis] ?? [];
        return (
          <Section key={axis} title={t.axis[axis]}>
            {values.map((v) => (
              <Check key={v} checked={selected.includes(v)} onChange={() => update({ [axis]: joined(toggle(selected, v)) })}>
                {v}
              </Check>
            ))}
          </Section>
        );
      })}
    </div>
  );
}
