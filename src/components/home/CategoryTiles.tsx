"use client";

import { Snowflake } from "lucide-react";
import Link from "next/link";
import { useSyncExternalStore } from "react";
import { AllCategoriesIcon, CategoryIcon } from "@/components/product/CategoryIcon";
import { useCategories } from "@/hooks/useCategories";
import { useI18n } from "@/hooks/useI18n";
import { setSeasonal, seasonalStore } from "@/lib/preferences";
import { trackEvent } from "@/services/analytics";
import type { ProductSummary } from "@/types/catalog";
import { categoryPath } from "@/utils/url";

export function CategoryTiles({ summaries }: { summaries: ProductSummary[] }) {
  const { t, num, lang, prefix } = useI18n();
  const { top, has } = useCategories();
  const seasonal = useSyncExternalStore(seasonalStore.subscribe, seasonalStore.get, () => true);
  const shown = top
    .filter((c) => (seasonal || !c.collection) && summaries.some((s) => has(c.slug, s.product)))
    .map((c) => ({
      c,
      count: summaries.filter((s) => has(c.slug, s.product)).length,
    }));
  const hasSeasonal = top.some((c) => c.collection && summaries.some((s) => has(c.slug, s.product)));
  return (
    <div className="relative">
      <nav
        aria-label={t.home.categoryEyebrow}
        className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-2"
      >
        {shown.map(({ c, count }) => (
          <Link
            key={c.slug}
            href={categoryPath(prefix, c.slug)}
            onClick={() => c.collection && trackEvent("seasonal-tile", categoryPath(prefix, c.slug))}
            className={`relative flex w-24 shrink-0 flex-col items-center gap-1.5 overflow-hidden rounded-md px-2 py-3 text-center shadow-md ring-2 ${c.collection ? "bg-gradient-to-br from-gold-soft to-accent-soft ring-gold/40" : "bg-surface ring-line-soft"}`}
          >
            {c.collection && (
              <Snowflake
                size={48}
                aria-hidden="true"
                className="pointer-events-none absolute -right-2 -bottom-2 z-0 text-gold/20"
              />
            )}
            <span className={`relative z-10 flex size-11 items-center justify-center rounded-full ${c.collection ? "bg-gold text-gold-ink" : "bg-brand-soft text-brand"}`}>
              <CategoryIcon name={c.icon} size={20} />
            </span>
            <span className="relative z-10 text-[13px] leading-tight font-semibold">
              {lang === "en" ? c.nameEn : c.name}
            </span>
            <span className="relative z-10 text-[11px] font-bold text-dim">
              {t.home.models(num(count))}
            </span>
          </Link>
        ))}
        <Link
          href={`${prefix}/search/`}
          className="flex w-24 shrink-0 flex-col items-center justify-center gap-1.5 rounded-md bg-surface px-2 py-3 text-center shadow-sm ring-1 ring-line-soft"
        >
          <span className="flex size-11 items-center justify-center rounded-full bg-surface-2 text-dim">
            <AllCategoriesIcon size={20} />
          </span>
          <span className="text-[13px] leading-tight font-semibold">
            {t.home.allCategories}
          </span>
          <span className="text-[11px] font-bold text-dim">
            {t.home.models(num(summaries.length))}
          </span>
        </Link>
        {hasSeasonal && (
          <button
            type="button"
            onClick={() => setSeasonal(!seasonal)}
            aria-pressed={seasonal}
            aria-label={seasonal ? t.home.seasonalHide : t.home.seasonalShow}
            className={`ml-1 flex h-9 shrink-0 items-center gap-1.5 self-center rounded-full px-3.5 text-[12.5px] font-semibold ring-2 transition-colors ${seasonal ? "bg-gold-soft text-gold-ink ring-gold/40" : "bg-surface text-dim ring-line-soft hover:ring-line"}`}
          >
            <Snowflake size={15} aria-hidden="true" />
            {t.home.seasonal}
          </button>
        )}
      </nav>
    </div>
  );
}