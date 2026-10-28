"use client";

import { ChevronDown } from "lucide-react";
import { Fragment, useEffect, useState, type ReactNode } from "react";
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
const LIMIT = 6;
const SEARCH_FROM = 12;

// শুরুতে খোলা থাকবে কিনা একবারই ঠিক হয়, পরে বাছাই বদলালে হঠাৎ বন্ধ-খোলা হয় না
function Section({ title, open = true, count = 0, children }: { title: string; open?: boolean; count?: number; children: ReactNode }) {
  const { num } = useI18n();
  const [initial] = useState(open);
  return (
    <details open={initial} className="group border-b border-line-soft last:border-b-0">
      <summary className="flex h-12 cursor-pointer list-none items-center gap-2 px-4 text-sm font-bold">
        {title}
        {count > 0 && <span className="rounded-full bg-brand px-1.5 text-xs text-brand-ink">{num(count)}</span>}
        <ChevronDown size={16} className="ml-auto text-dim transition-transform group-open:rotate-180" aria-hidden="true" />
      </summary>
      <div className="flex flex-col gap-2 px-4 pb-4">{children}</div>
    </details>
  );
}

interface Option {
  key: string;
  text: string;
  selected: boolean;
  node: ReactNode;
}

// লম্বা তালিকায় প্রথম কয়েকটা আর বাছাই করাগুলো; বাকিগুলো "আরও" চাপলে বা খুঁজলে
function Options({ label, options }: { label: string; options: Option[] }) {
  const { t, num } = useI18n();
  const [all, setAll] = useState(false);
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const matched = q ? options.filter((o) => o.text.toLowerCase().includes(q)) : options;
  const extra = q ? 0 : matched.filter((o, i) => i >= LIMIT && !o.selected).length;
  const shown = all || !extra ? matched : matched.filter((o, i) => i < LIMIT || o.selected);
  return (
    <>
      {options.length > SEARCH_FROM && (
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.search.findIn(label)}
          aria-label={t.search.findIn(label)}
          className="mb-1 h-9 rounded-md border border-line bg-surface px-2.5 text-sm outline-none focus:border-brand"
        />
      )}
      {shown.map((o) => (
        <Fragment key={o.key}>{o.node}</Fragment>
      ))}
      {extra > 0 && (
        <button type="button" onClick={() => setAll(!all)} className="self-start text-sm font-semibold text-brand-text hover:underline">
          {all ? t.search.less : t.search.more(num(extra))}
        </button>
      )}
    </>
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
  const { t } = useI18n();
  const { top, childrenOf, name } = useCategories();
  const slugs = top.flatMap((c) => [{ slug: c.slug, child: false }, ...childrenOf(c.slug).map((x) => ({ slug: x.slug, child: true }))]);
  const resetAxes = Object.fromEntries(facets.axes.map(({ axis }) => [axis, null]));
  return (
    <div className="flex flex-col">
      <Section title={t.search.category} open={!filters.category}>
        <Options
          label={t.search.category}
          options={[{ slug: null, child: false }, ...slugs].map(({ slug, child }) => ({
            key: slug ?? "all",
            text: slug ? name(slug) : t.search.all,
            selected: filters.category === slug,
            node: (
              <label className={`flex min-h-8 cursor-pointer items-center gap-2.5 text-sm ${child ? "pl-6" : ""}`}>
                <input
                  type="radio"
                  name="category"
                  checked={filters.category === slug}
                  onChange={() => update({ ...resetAxes, category: slug, brand: null })}
                  className="size-4 accent-[var(--color-brand)]"
                />
                {slug ? name(slug) : t.search.all}
              </label>
            ),
          }))}
        />
      </Section>

      {facets.priceCeil > facets.priceFloor && (
        <Section title={t.search.budget}>
          <Budget key={`${filters.min}-${filters.max}-${facets.priceFloor}-${facets.priceCeil}`} filters={filters} facets={facets} update={update} />
        </Section>
      )}

      {facets.brands.length > 0 && (
        <Section title={t.search.brand} count={filters.brands.length}>
          <Options
            label={t.search.brand}
            options={facets.brands.map((b) => ({
              key: b,
              text: b,
              selected: filters.brands.includes(b),
              node: (
                <Check checked={filters.brands.includes(b)} onChange={() => update({ brand: joined(toggle(filters.brands, b)) })}>
                  {b}
                </Check>
              ),
            }))}
          />
        </Section>
      )}

      <Section title={t.search.availability}>
        <Check checked={filters.inStock} onChange={() => update({ stock: filters.inStock ? null : "1" })}>
          {t.search.inStock}
        </Check>
      </Section>

      {facets.axes.map(({ axis, values }) => {
        const selected = filters.attributes[axis] ?? [];
        return (
          <Section key={axis} title={t.axis[axis]} open={selected.length > 0} count={selected.length}>
            <Options
              label={t.axis[axis]}
              options={values.map((v) => ({
                key: v,
                text: v,
                selected: selected.includes(v),
                node: (
                  <Check checked={selected.includes(v)} onChange={() => update({ [axis]: joined(toggle(selected, v)) })}>
                    {v}
                  </Check>
                ),
              }))}
            />
          </Section>
        );
      })}
    </div>
  );
}
