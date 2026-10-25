"use client";

import { ProductCard } from "@/components/product/ProductCard";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { useCategories } from "@/hooks/useCategories";
import { useI18n } from "@/hooks/useI18n";
import type { ProductSummary } from "@/types/catalog";
import { byPopularity } from "@/utils/catalog";
import { categoryPath } from "@/utils/url";
import { Shelf } from "./Shelf";

export function CategoryRows({ summaries }: { summaries: ProductSummary[] }) {
  const { t, num, lang, prefix } = useI18n();
  const { top, family } = useCategories();
  return (
    <>
      {top.map((c) => {
        const items = summaries
          .filter((s) => family(c.slug).includes(s.product.category))
          .sort(byPopularity);
        if (!items.length) return null;
        return (
          <Shelf key={c.slug}>
            <SectionHeader
              title={lang === "en" ? c.nameEn : c.name}
              href={categoryPath(prefix, c.slug)}
              linkLabel={t.home.seeAllIn(num(items.length))}
            />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {items.slice(0, 6).map((summary) => (
                <ProductCard key={summary.product.id} summary={summary} />
              ))}
            </div>
          </Shelf>
        );
      })}
    </>
  );
}
