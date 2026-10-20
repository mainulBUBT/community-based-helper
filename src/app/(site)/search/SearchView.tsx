"use client";

import { SearchX, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SubmitPriceDialog } from "@/components/forms/SubmitPriceDialog";
import { ProductCard } from "@/components/product/ProductCard";
import { SearchBox } from "@/components/search/SearchBox";
import { Chip } from "@/components/ui/Chip";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorNotice } from "@/components/ui/ErrorNotice";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { useAsync } from "@/hooks/useAsync";
import { useI18n } from "@/hooks/useI18n";
import { listSummaries } from "@/services/catalog";
import type { Category, ProductSummary } from "@/types/catalog";
import { matchesQuery } from "@/utils/catalog";
import { formatTaka } from "@/utils/format";

const CATEGORY_IDS: Category[] = ["mobile", "apple", "watch"];
const PRICE_RANGES = [
  { id: "u20", max: 20000 },
  { id: "20-40", min: 20000, max: 40000 },
  { id: "40-80", min: 40000, max: 80000 },
  { id: "80-150", min: 80000, max: 150000 },
  { id: "o150", min: 150000 },
] as const;
const SORTS = ["popular", "cheap", "expensive", "drop"] as const;
type Sort = (typeof SORTS)[number];

const priceOf = (s: ProductSummary, unofficial: boolean) => (unofficial ? s.lowestAny : s.lowest) ?? Infinity;

const COMPARE: Record<Sort, (a: ProductSummary, b: ProductSummary, unofficial: boolean) => number> = {
  popular: (a, b) => b.product.popularity - a.product.popularity,
  cheap: (a, b, u) => priceOf(a, u) - priceOf(b, u),
  expensive: (a, b, u) => (priceOf(b, u) === Infinity ? -1 : priceOf(b, u)) - (priceOf(a, u) === Infinity ? -1 : priceOf(a, u)),
  drop: (a, b) => (b.drop ?? 0) - (a.drop ?? 0),
};

export function SearchView() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const { t, num } = useI18n();
  const { data, error, loading, reload } = useAsync(listSummaries, []);

  const query = params.get("q") ?? "";
  const category = params.get("category") as Category | null;
  const brand = params.get("brand");
  const range = PRICE_RANGES.find((r) => r.id === params.get("price"));
  const sort = (SORTS as readonly string[]).includes(params.get("sort") ?? "") ? (params.get("sort") as Sort) : "popular";
  const inStockOnly = params.get("stock") === "1";
  const unofficial = params.get("unofficial") === "1";
  const hasFilters = Boolean(category || brand || range || inStockOnly || unofficial);

  function update(next: Record<string, string | null>) {
    const search = new URLSearchParams(params);
    for (const [key, value] of Object.entries(next)) {
      if (value) search.set(key, value);
      else search.delete(key);
    }
    router.replace(`${pathname}${search.size ? `?${search}` : ""}`, { scroll: false });
  }

  const summaries = data ?? [];
  const brands = [...new Set(summaries.filter((s) => !category || s.product.category === category).map((s) => s.product.brand))];
  const results = summaries
    .filter((s) => {
      const price = priceOf(s, unofficial);
      return (
        (!category || s.product.category === category) &&
        (!brand || s.product.brand === brand) &&
        (!query || matchesQuery(s.product, query)) &&
        (!inStockOnly || s.inStock) &&
        (!range || (price >= ("min" in range ? range.min : 0) && price < ("max" in range ? range.max : Infinity)))
      );
    })
    .sort((a, b) => COMPARE[sort](a, b, unofficial));

  const rangeLabel = (r: (typeof PRICE_RANGES)[number]) =>
    "min" in r && "max" in r ? t.search.between(formatTaka(r.min), formatTaka(r.max)) : "max" in r ? t.search.under(formatTaka(r.max)) : t.search.above(formatTaka(r.min));

  return (
    <div className="flex flex-col gap-4">
      <SearchBox key={query} defaultValue={query} onSearch={(q) => update({ q: q || null })} />

      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
        <Chip selected={!category} onClick={() => update({ category: null, brand: null })}>
          {t.search.all}
        </Chip>
        {CATEGORY_IDS.map((id) => (
          <Chip key={id} selected={category === id} onClick={() => update({ category: id, brand: null })}>
            {t.category[id].label}
          </Chip>
        ))}
      </div>

      <details className="group rounded-md bg-surface shadow-sm ring-1 ring-line-soft" open={hasFilters || undefined}>
        <summary className="flex h-12 cursor-pointer list-none items-center justify-between px-4 font-semibold">
          {t.search.filters}
          <span className="text-sm text-dim group-open:hidden">{hasFilters ? "•" : ""}</span>
        </summary>
        <div className="flex flex-col gap-4 border-t border-line-soft p-4">
          <div className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-dim">{t.search.brand}</span>
            <div className="flex flex-wrap gap-2">
              {brands.map((b) => (
                <Chip key={b} selected={brand === b} onClick={() => update({ brand: brand === b ? null : b })}>
                  {b}
                </Chip>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-dim">{t.search.price}</span>
            <div className="flex flex-wrap gap-2">
              <Chip selected={!range} onClick={() => update({ price: null })}>
                {t.search.anyPrice}
              </Chip>
              {PRICE_RANGES.map((r) => (
                <Chip key={r.id} selected={range?.id === r.id} onClick={() => update({ price: r.id })}>
                  {rangeLabel(r)}
                </Chip>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Chip selected={inStockOnly} onClick={() => update({ stock: inStockOnly ? null : "1" })}>
              {t.search.inStock}
            </Chip>
            <Chip selected={unofficial} onClick={() => update({ unofficial: unofficial ? null : "1" })}>
              {t.search.unofficialToo}
            </Chip>
          </div>
          {hasFilters && (
            <button
              type="button"
              onClick={() => update({ category: null, brand: null, price: null, stock: null, unofficial: null })}
              className="flex items-center gap-1.5 self-start text-sm font-semibold text-brand"
            >
              <X size={16} aria-hidden="true" />
              {t.search.clear}
            </button>
          )}
        </div>
      </details>

      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
        {SORTS.map((s) => (
          <Chip key={s} selected={sort === s} onClick={() => update({ sort: s === "popular" ? null : s })}>
            {t.search.sort[s]}
          </Chip>
        ))}
      </div>

      {loading ? (
        <ListSkeleton />
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
          <p className="text-sm text-dim">{t.search.count(num(results.length))}</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {results.map((summary) => (
              <ProductCard key={summary.product.id} summary={summary} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
