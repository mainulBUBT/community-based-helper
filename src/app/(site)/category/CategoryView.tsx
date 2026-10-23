"use client";

import { ChevronRight, SearchX } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { ProductCard } from "@/components/product/ProductCard";
import { FilterPanel, type Facets, type Filters } from "@/components/search/FilterPanel";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination, paginate } from "@/components/ui/Pagination";
import { ListSkeleton, Skeleton } from "@/components/ui/Skeleton";
import { useAsync } from "@/hooks/useAsync";
import { useCategories } from "@/hooks/useCategories";
import { useI18n } from "@/hooks/useI18n";
import { listSummaries } from "@/services/catalog";
import { AXES, type Axis, type ProductSummary } from "@/types/catalog";
import { sortAxisValues } from "@/utils/variants";

const SORTS = ["popular", "cheap", "expensive", "drop"] as const;
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

function axisValues(summaries: ProductSummary[], axis: Axis) {
  return sortAxisValues(axis, [...new Set(summaries.flatMap((s) => s.product.variants.map((v) => v.attributes[axis]).filter((v): v is string => Boolean(v))))]);
}

interface CategoryViewProps {
  slug: string;
}

export function CategoryView({ slug }: CategoryViewProps) {
  const params = useSearchParams();
  const { t, num: n, prefix } = useI18n();
  const { find, family } = useCategories();
  const { data, error, loading } = useAsync(listSummaries, []);
  const [drawer, setDrawer] = useState(false);

  const category = find(slug);
  const filters = {
    category: slug,
    brands: list(params.get("brand")),
    min: num(params.get("min")),
    max: num(params.get("max")),
    inStock: params.get("stock") === "1",
    unofficial: params.get("unofficial") === "1",
    attributes: Object.fromEntries(AXES.map((axis) => [axis, list(params.get(axis))]).filter(([, values]) => values.length)),
  } satisfies Filters;
  const sort = (SORTS as readonly string[]).includes(params.get("sort") ?? "") ? (params.get("sort") as Sort) : "popular";

  const summaries = data ?? [];
  const familySet = new Set(family(slug));
  const results = summaries.filter((s) => familySet.has(s.product.category)).sort((a, b) => COMPARE[sort](a, b, filters.unofficial));
  const paged = paginate(results, Number(params.get("page")) || 1, 24);
  const prices = results.map((s) => priceOf(s, filters.unofficial)).filter((p): p is number => p !== null);
  const facets: Facets = {
    brands: [...new Set(results.map((s) => s.product.brand))].sort(),
    axes: (category?.axes ?? AXES).map((axis) => ({ axis, values: axisValues(results, axis) })).filter((f) => f.values.length > 1),
    priceFloor: prices.length ? Math.floor(Math.min(...prices) / 1000) * 1000 : 0,
    priceCeil: prices.length ? Math.ceil(Math.max(...prices) / 1000) * 1000 : 0,
  };

  return (
    <div className="flex flex-col gap-4">
      <nav aria-label="breadcrumb" className="flex items-center gap-1 text-sm text-dim">
        <Link href={`${prefix}/`} className="hover:text-brand">{t.nav.home}</Link>
        <ChevronRight className="size-3 shrink-0 text-faint" />
        <span className="font-medium text-ink" aria-current="page">{category?.name ?? slug}</span>
      </nav>

      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-ink sm:text-2xl">{category?.name ?? slug}</h1>
          <p className="mt-1 text-sm text-dim">{t.home.category.found(paged.items.length)}</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={sort}
            onChange={(e) => {
              const search = new URLSearchParams(window.location.search);
              search.set("sort", e.target.value);
              search.delete("page");
              window.location.search = search.toString();
            }}
            className="rounded-md border border-line bg-surface px-2.5 py-1.5 text-sm font-medium text-ink outline-none ring-brand focus:ring-2"
          >
            <option value="popular">{t.home.category.sortPopular}</option>
            <option value="cheap">{t.home.category.sortPrice}</option>
            <option value="expensive">{t.home.category.sortExpensive}</option>
            <option value="drop">{t.home.category.sortDrop}</option>
          </select>
          <button
            onClick={() => setDrawer(true)}
            className="inline-flex items-center gap-1.5 rounded-md border border-line bg-surface px-3 py-1.5 text-sm font-medium text-ink transition-shadow hover:shadow-sm md:hidden"
          >
            Filters
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton key={i} className="aspect-[3/5]" />
          ))}
        </div>
      ) : error ? (
        <div role="alert" className="flex flex-col items-start gap-3 rounded-lg border border-line bg-surface p-4">
          <p className="font-semibold">{t.common.loadError}</p>
          <button type="button" onClick={() => window.location.reload()} className="h-10 rounded-md border border-line px-4 text-sm font-semibold hover:border-brand">
            {t.common.retry}
          </button>
        </div>
      ) : paged.items.length === 0 ? (
        <EmptyState icon={SearchX} title={t.home.category.empty}>
          <p className="text-sm text-dim">{t.home.category.emptySub}</p>
        </EmptyState>
      ) : (
        <>
          <div className="hidden md:block">
            <FilterPanel filters={filters} facets={facets} update={(patch) => {
              const search = new URLSearchParams(window.location.search);
              for (const [key, value] of Object.entries(patch)) {
                if (value) search.set(key, value);
                else search.delete(key);
              }
              if (!search.has("page")) search.delete("page");
              window.location.search = search.toString();
            }} />
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
            {paged.items.map((s) => (
              <ProductCard key={s.product.id} summary={s} />
            ))}
          </div>

          {paged.pages > 1 && (
            <Pagination
              page={paged.page}
              pages={paged.pages}
              onChange={(p) => {
                const search = new URLSearchParams(window.location.search);
                search.set("page", p > 1 ? String(p) : "");
                window.location.search = search.toString();
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              labels={{ prev: "Previous", next: "Next", nav: "Page navigation" }}
            />
          )}
        </>
      )}

      {drawer && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDrawer(false)} />
          <div className="relative ml-auto flex h-full w-full max-w-sm flex-col bg-page shadow-xl">
            <div className="flex items-center gap-3 border-b border-line-soft px-4 py-3">
              <button onClick={() => setDrawer(false)} className="rounded-md p-1 text-dim hover:bg-surface-2 hover:text-ink">
                ✕
              </button>
              <h2 className="text-base font-bold text-ink">Filters</h2>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-3">
              <FilterPanel filters={filters} facets={facets} update={(patch) => {
                const search = new URLSearchParams(window.location.search);
                for (const [key, value] of Object.entries(patch)) {
                  if (value) search.set(key, value);
                  else search.delete(key);
                }
                if (!search.has("page")) search.delete("page");
                window.location.search = search.toString();
                setDrawer(false);
              }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
