"use client";

import { useSyncExternalStore } from "react";
import { ProductCard } from "@/components/product/ProductCard";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { useCategories } from "@/hooks/useCategories";
import { useI18n } from "@/hooks/useI18n";
import type { ProductSummary } from "@/types/catalog";
import { byPopularity, byStock } from "@/utils/catalog";
import { categoryPath } from "@/utils/url";
import { Shelf } from "./Shelf";

const ROW_SIZE = 6;
// প্রতিবার পাতা খুললে একবার; build এর HTML এ জনপ্রিয় ৬টা, ব্রাউজারে hydration এর পরে এলোমেলো ৬টা
const seed = typeof window === "undefined" ? 0 : Math.random();
const still = () => () => {};

function pick(items: ProductSummary[], roll: number) {
  if (!roll) return items.slice(0, ROW_SIZE);
  const stocked = items.filter((s) => s.inStock);
  const shuffled = [...(stocked.length >= ROW_SIZE ? stocked : items)];
  let state = Math.floor(roll * 2 ** 31) || 1;
  const next = () => {
    state = (state * 1103515245 + 12345) % 2 ** 31;
    return state / 2 ** 31;
  };
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, ROW_SIZE);
}

export function CategoryRows({ summaries }: { summaries: ProductSummary[] }) {
  const { t, num, lang, prefix } = useI18n();
  const { top, family } = useCategories();
  const roll = useSyncExternalStore(still, () => seed, () => 0);
  return (
    <>
      {top.map((c) => {
        const items = summaries
          .filter((s) => family(c.slug).includes(s.product.category))
          .sort((a, b) => byStock(a, b) || byPopularity(a, b));
        if (!items.length) return null;
        return (
          <Shelf key={c.slug}>
            <SectionHeader
              title={lang === "en" ? c.nameEn : c.name}
              subtitle={t.home.categoryRowSub}
              href={categoryPath(prefix, c.slug)}
              linkLabel={t.home.seeAllIn(num(items.length))}
            />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {pick(items, roll).map((summary) => (
                <ProductCard key={summary.product.id} summary={summary} />
              ))}
            </div>
          </Shelf>
        );
      })}
    </>
  );
}
