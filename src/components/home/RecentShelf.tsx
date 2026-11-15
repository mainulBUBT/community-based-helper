"use client";

import { ProductCard } from "@/components/product/ProductCard";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { useI18n } from "@/hooks/useI18n";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import type { ProductSummary } from "@/types/catalog";
import { Shelf } from "./Shelf";

const DESKTOP_LIMIT = 6;

export function RecentShelf({ summaries }: { summaries: ProductSummary[] }) {
  const { t } = useI18n();
  const viewed = useRecentlyViewed();
  const bySlug = new Map(summaries.map((s) => [s.product.slug, s]));
  const items = viewed.flatMap((v) => bySlug.get(v.slug) ?? []);
  if (!items.length) return null;

  return (
    <Shelf>
      <SectionHeader title={t.home.recent} subtitle={t.home.recentSub} />
      <div className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain lg:grid lg:grid-cols-6 lg:overflow-visible">
        {items.map((summary, i) => (
          <div key={summary.product.id} className={`w-[calc(50%-6px)] shrink-0 snap-start sm:w-[calc(33.333%-8px)] lg:w-auto ${i >= DESKTOP_LIMIT ? "lg:hidden" : ""}`}>
            <ProductCard summary={summary} />
          </div>
        ))}
      </div>
    </Shelf>
  );
}
