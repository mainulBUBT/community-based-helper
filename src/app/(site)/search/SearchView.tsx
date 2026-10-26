"use client";

import { ChevronRight, SearchX, SlidersHorizontal, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { SubmitPriceDialog } from "@/components/forms/SubmitPriceDialog";
import { ProductCard } from "@/components/product/ProductCard";
import { FilterPanel, type Facets, type Filters } from "@/components/search/FilterPanel";
import { SearchBox } from "@/components/search/SearchBox";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination, paginate } from "@/components/ui/Pagination";
import { ErrorNotice } from "@/components/ui/ErrorNotice";
import { ShareButton } from "@/components/ui/ShareButton";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAsync } from "@/hooks/useAsync";
import { useCategories } from "@/hooks/useCategories";
import { useI18n } from "@/hooks/useI18n";
import { trackView } from "@/services/analytics";
import { listSummaries } from "@/services/catalog";
import { AXES, type Axis, type ProductSummary } from "@/types/catalog";
import { byStock, matchesQuery } from "@/utils/catalog";
import { formatTaka } from "@/utils/format";
import { categoryPath } from "@/utils/url";
import { sortAxisValues } from "@/utils/variants";

const SORTS = ["popular", "cheap", "expensive", "drop"] as const;
const PAGE_SIZE = 24;
type Sort = (typeof SORTS)[number];

const priceOf = (s: ProductSummary, unofficial: boolean) => (unofficial ? s.lowestAny : s.lowest);
const list = (value: string | null) => (value ? value.split(",").filter(Boolean) : []);
const num = (value: string | null) => (value && Number(value) > 0 ? Number(value) : null);

const COMPARE: Record<Sort, (a: ProductSummary, b: ProductSummary, unofficial: boolean) => number> = {
  popular: (a, b) => b.product.popularity - a.product.popularity,
  cheap: (a, b, u) => (priceOf(a, u) ?? Infinity) - (priceOf(b, u) ?? Infinity),
  expensive: (a, b, u) => (priceOf(b, u) ?? -1) - (priceOf(a, u) ?? -1),
  drop: (a, b) => (b.drop ?? 0) - (a.drop ?? 0),
};

const axisValues = (summaries: ProductSummary[], axis: Axis) =>
  sortAxisValues(axis, [...new Set(summaries.flatMap((s) => s.product.variants.map((v) => v.attributes[axis]).filter((v): v is string => Boolean(v))))]);

function readFilters(params: URLSearchParams, category?: string, brand?: string): Filters {
  return {
    category: category ?? params.get("category"),
    brands: brand ? [brand] : list(params.get("brand")),
    min: num(params.get("min")),
    max: num(params.get("max")),
    inStock: params.get("stock") === "1",
    unofficial: params.get("unofficial") === "1",
    attributes: Object.fromEntries(AXES.map((axis) => [axis, list(params.get(axis))]).filter(([, values]) => values.length)),
  };
}

function matches(s: ProductSummary, f: Filters, query: string, family: Set<string> | null) {
  const price = priceOf(s, f.unofficial);
  return (
    (!family || family.has(s.product.category)) &&
    (!f.brands.length || f.brands.includes(s.product.brand)) &&
    (!query || matchesQuery(s.product, query)) &&
    (!f.inStock || s.inStock) &&
    (f.min === null || (price !== null && price >= f.min)) &&
    (f.max === null || (price !== null && price <= f.max)) &&
    Object.entries(f.attributes).every(([axis, values]) => s.product.variants.some((v) => values.includes(v.attributes[axis as Axis] ?? "")))
  );
}

function GridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }, (_, i) => (
        <Skeleton key={i} className="aspect-[3/5]" />
      ))}
    </div>
  );
}

// ক্যাটাগরি পেজে সার্ভার ওই ভাগের পণ্য দিয়ে দেয়, তখন পুরো ক্যাটালগ আর নামাতে হয় না
export function SearchView({ category, brand, initial }: { category?: string; brand?: string; initial?: ProductSummary[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const { t, num: n, prefix, lang } = useI18n();
  const { find, name, family } = useCategories();
  const { data, error, loading, reload } = useAsync(() => (initial ? Promise.resolve(initial) : listSummaries()), [], initial ?? null);
  const [drawer, setDrawer] = useState(false);

  const query = params.get("q") ?? "";
  const filters = readFilters(params, category, brand);

  // প্রতিটা অক্ষরে নয়, খোঁজা শেষ হলে একবার: অ্যাডমিন দেখে কী খোঁজা হচ্ছে
  useEffect(() => {
    if (query.trim()) trackView(`${pathname}?q=${encodeURIComponent(query.trim().toLowerCase().slice(0, 100))}`);
  }, [pathname, query]);
  const sort = (SORTS as readonly string[]).includes(params.get("sort") ?? "") ? (params.get("sort") as Sort) : "popular";

  const update = useCallback(
    (patch: Record<string, string | null>) => {
      const search = new URLSearchParams(window.location.search);
      if (!("page" in patch)) search.delete("page");
      for (const [key, value] of Object.entries(patch)) {
        if (value) search.set(key, value);
        else search.delete(key);
      }
      if (category) search.delete("category");
      const suffix = search.size ? `?${search}` : "";
      if (category && "category" in patch && patch.category !== category) {
        router.push(`${patch.category ? categoryPath(prefix, patch.category) : `${prefix}/search/`}${suffix}`);
      } else {
        router.replace(`${pathname}${suffix}`, { scroll: false });
      }
    },
    [category, pathname, prefix, router],
  );

  const summaries = data ?? [];
  const familySet = filters.category ? new Set(family(filters.category)) : null;
  const inCategory = summaries.filter((s) => !familySet || familySet.has(s.product.category));
  const prices = inCategory.map((s) => priceOf(s, filters.unofficial)).filter((p): p is number => p !== null);
  const facets: Facets = {
    brands: [...new Set(inCategory.map((s) => s.product.brand))].sort(),
    axes: (find(filters.category)?.axes ?? AXES).map((axis) => ({ axis, values: axisValues(inCategory, axis) })).filter((f) => f.values.length > 1),
    priceFloor: prices.length ? Math.floor(Math.min(...prices) / 1000) * 1000 : 0,
    priceCeil: prices.length ? Math.ceil(Math.max(...prices) / 1000) * 1000 : 0,
  };
  const results = summaries.filter((s) => matches(s, filters, query, familySet)).sort((a, b) => byStock(a, b) || COMPARE[sort](a, b, filters.unofficial));
  const paged = paginate(results, Number(params.get("page")) || 1, PAGE_SIZE);
  const goTo = (page: number) => {
    update({ page: page > 1 ? String(page) : null });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const active: { label: string; patch: Record<string, string | null> }[] = [
    ...(brand ? [] : filters.brands.map((b) => ({ label: b, patch: { brand: filters.brands.filter((x) => x !== b).join(",") || null } }))),
    ...(filters.min !== null || filters.max !== null
      ? [{ label: `${formatTaka(filters.min ?? facets.priceFloor, lang)} – ${formatTaka(filters.max ?? facets.priceCeil, lang)}`, patch: { min: null, max: null } }]
      : []),
    ...(filters.inStock ? [{ label: t.search.inStock, patch: { stock: null } }] : []),
    ...(filters.unofficial ? [{ label: t.search.unofficialToo, patch: { unofficial: null } }] : []),
    ...Object.entries(filters.attributes).flatMap(([axis, values]) =>
      values.map((v) => ({ label: `${t.axis[axis as Axis]}: ${v}`, patch: { [axis]: values.filter((x) => x !== v).join(",") || null } })),
    ),
  ];
  const clearAll = { brand: null, min: null, max: null, stock: null, unofficial: null, ...Object.fromEntries(AXES.map((axis) => [axis, null])) };
  const categoryTitle = brand ?? (filters.category ? name(filters.category) : t.search.allProducts);
  const title = query ? t.search.resultsFor(query) : categoryTitle;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <nav aria-label="breadcrumb" className="flex min-w-0 items-center gap-1 text-sm text-dim">
          <Link href={`${prefix}/`} className="hover:text-brand">
            {t.nav.home}
          </Link>
          <ChevronRight size={14} aria-hidden="true" />
          <span className="truncate text-ink">{categoryTitle}</span>
        </nav>
        <ShareButton
          title={title}
          label
          className="flex h-9 shrink-0 items-center gap-1.5 rounded-md border border-line bg-surface px-3 text-sm font-semibold text-dim hover:border-dim hover:text-ink"
        />
      </div>

      <div className="max-w-2xl">
        <SearchBox key={query} defaultValue={query} onSearch={(q) => update({ q: q || null })} />
      </div>

      {!brand && facets.brands.length > 0 && (
        <div className="hidden flex-wrap gap-2 md:flex">
          {[null, ...facets.brands].map((b) => {
            const selected = b ? filters.brands.length === 1 && filters.brands[0] === b : !filters.brands.length;
            return (
              <button
                key={b ?? "all"}
                type="button"
                aria-pressed={selected}
                onClick={() => update({ brand: b })}
                className={`h-9 shrink-0 rounded-full border px-4 text-sm font-semibold transition-colors ${selected ? "border-brand bg-brand text-brand-ink" : "border-line bg-surface hover:border-brand"}`}
              >
                {b ?? t.search.all}
              </button>
            );
          })}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="hidden self-start overflow-hidden rounded-lg bg-surface ring-1 ring-line lg:sticky lg:top-32 lg:block">
          <FilterPanel filters={filters} facets={facets} update={update} />
        </aside>

        <section className="flex min-w-0 flex-col gap-4">
          <div className="grid grid-cols-2 items-center gap-3 rounded-lg bg-surface px-4 py-3 ring-1 ring-line lg:flex">
            <div className="col-span-2 flex min-w-0 flex-1 items-baseline justify-between gap-3 lg:flex-col lg:items-start lg:gap-0">
              <h1 className="truncate text-lg font-bold">{title}</h1>
              {!loading && <span className="shrink-0 text-xs whitespace-nowrap text-dim">{t.search.count(n(results.length))}</span>}
            </div>
            <button
              type="button"
              onClick={() => setDrawer(true)}
              className="flex h-10 items-center justify-center gap-2 rounded-md border border-line px-3 text-sm font-semibold hover:border-brand lg:hidden"
            >
              <SlidersHorizontal size={16} aria-hidden="true" />
              {t.search.filters}
              {active.length > 0 && <span className="rounded-full bg-brand px-1.5 text-xs text-brand-ink">{n(active.length)}</span>}
            </button>
            <label className="flex min-w-0 items-center gap-2 text-sm">
              <span className="hidden shrink-0 text-dim lg:inline">{t.search.sortBy}</span>
              <select
                value={sort}
                aria-label={t.search.sortBy}
                onChange={(e) => update({ sort: e.target.value === "popular" ? null : e.target.value })}
                className="h-10 w-full min-w-0 rounded-md border border-line bg-surface px-2 font-semibold outline-none focus:border-brand lg:w-auto"
              >
                {SORTS.map((s) => (
                  <option key={s} value={s}>
                    {t.search.sort[s]}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {active.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              {active.map((f) => (
                <button key={f.label} type="button" onClick={() => update(f.patch)} className="flex h-8 items-center gap-1.5 rounded-full bg-brand-soft px-3 text-sm font-semibold text-brand-text">
                  {f.label}
                  <X size={14} aria-hidden="true" />
                </button>
              ))}
              <button type="button" onClick={() => update(clearAll)} className="text-sm font-semibold text-dim underline-offset-2 hover:underline">
                {t.search.clear}
              </button>
            </div>
          )}

          {loading ? (
            <GridSkeleton />
          ) : error && !data ? (
            <ErrorNotice onRetry={reload} />
          ) : results.length === 0 ? (
            <EmptyState icon={SearchX} title={query ? t.search.notFound(query) : t.search.emptyCategory}>
              <SubmitPriceDialog
                product={query}
                trigger={(open) => (
                  <button type="button" onClick={open} className="h-11 rounded-md bg-brand px-5 font-bold text-brand-ink">
                    {t.search.tellUs}
                  </button>
                )}
              />
            </EmptyState>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
                {paged.items.map((summary) => (
                  <ProductCard key={summary.product.id} summary={summary} />
                ))}
              </div>
              <Pagination page={paged.page} pages={paged.pages} onChange={goTo} labels={t.common.pager} format={n} />
            </>
          )}
        </section>
      </div>

      {drawer && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label={t.search.filters}>
          <button type="button" aria-label={t.common.close} onClick={() => setDrawer(false)} className="absolute inset-0 bg-black/45" />
          <div className="absolute inset-y-0 right-0 flex w-full flex-col bg-surface shadow-2xl sm:w-[22rem]">
            <div className="flex h-14 items-center justify-between border-b border-line px-4">
              <span className="font-bold">{t.search.filters}</span>
              <button type="button" aria-label={t.common.close} onClick={() => setDrawer(false)} className="flex size-10 items-center justify-center rounded-md hover:bg-surface-2">
                <X size={20} aria-hidden="true" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <FilterPanel filters={filters} facets={facets} update={update} />
            </div>
            <div className="flex gap-2 border-t border-line p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
              <button type="button" onClick={() => update(clearAll)} className="h-11 flex-1 rounded-md border border-line font-semibold">
                {t.search.clear}
              </button>
              <button type="button" onClick={() => setDrawer(false)} className="h-11 flex-[2] rounded-md bg-brand font-bold text-brand-ink">
                {t.search.showResults(n(results.length))}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
