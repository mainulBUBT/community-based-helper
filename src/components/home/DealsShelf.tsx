"use client";

import { useMemo } from "react";
import { ProductCard } from "@/components/product/ProductCard";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { useI18n } from "@/hooks/useI18n";
import type { ProductSummary } from "@/types/catalog";
import type { RecentDrop } from "@/utils/catalog";
import { SectionEyebrow, Shelf } from "./Shelf";
import { SlideItem, SlideTrack } from "./SlideTrack";

// নিজে নিজে সরে, আবার হাতেও: মোবাইলে সোয়াইপ, ডেস্কটপে মাউসে টেনে বা তীর চেপে, দুই দিকেই
export function DealsShelf({
  deals,
  interval,
}: {
  deals: (RecentDrop & { summary: ProductSummary })[];
  interval: number;
}) {
  const { t, num } = useI18n();
  const items = useMemo(() => deals.slice(0, 20), [deals]);

  if (!items.length) return null;

  return (
    <Shelf>
      <div className="flex flex-col gap-3">
        <SectionEyebrow>{t.home.dropsEyebrow}</SectionEyebrow>
        <SectionHeader
          title={t.home.drops}
          subtitle={t.home.dropsSub}
        />
      </div>
      <SlideTrack interval={interval}>
        {items.map(({ summary, from, amount, daysAgo }, i) => (
          <SlideItem key={summary.product.id}>
            <ProductCard
              summary={{ ...summary, compareAt: from }}
              deal={amount}
              badge={<span className="rounded-xs bg-surface/95 px-1.5 py-0.5 text-[10px] font-bold text-ink ring-1 ring-line">{t.home.droppedWhen(daysAgo, num(daysAgo))}</span>}
              loading={i < 5 ? "eager" : "lazy"}
            />
          </SlideItem>
        ))}
      </SlideTrack>
    </Shelf>
  );
}
