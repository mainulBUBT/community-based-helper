"use client";

import { ProductCard } from "@/components/product/ProductCard";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { useI18n } from "@/hooks/useI18n";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import type { ProductSummary } from "@/types/catalog";
import { Shelf } from "./Shelf";
import { SlideItem, SlideTrack } from "./SlideTrack";

export function RecentShelf({ summaries }: { summaries: ProductSummary[] }) {
  const { t } = useI18n();
  const viewed = useRecentlyViewed();
  const bySlug = new Map(summaries.map((s) => [s.product.slug, s]));
  const items = viewed.flatMap((v) => bySlug.get(v.slug) ?? []);
  if (!items.length) return null;

  return (
    <Shelf>
      <SectionHeader title={t.home.recent} subtitle={t.home.recentSub} />
      <SlideTrack>
        {items.map((summary) => (
          <SlideItem key={summary.product.id}>
            <ProductCard summary={summary} />
          </SlideItem>
        ))}
      </SlideTrack>
    </Shelf>
  );
}
