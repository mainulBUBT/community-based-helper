"use client";

import Link from "next/link";
import { AllCategoriesIcon, CategoryIcon } from "@/components/product/CategoryIcon";
import { useCategories } from "@/hooks/useCategories";
import { useI18n } from "@/hooks/useI18n";
import type { ProductSummary } from "@/types/catalog";
import { categoryPath } from "@/utils/url";

export function CategoryTiles({ summaries }: { summaries: ProductSummary[] }) {
  const { t, num, lang, prefix } = useI18n();
  const { top, family } = useCategories();
  const shown = top
    .filter((c) =>
      summaries.some((s) => family(c.slug).includes(s.product.category)),
    )
    .map((c) => ({
      c,
      count: summaries.filter((s) =>
        family(c.slug).includes(s.product.category),
      ).length,
    }));
  return (
    <nav
      aria-label={t.home.categoryEyebrow}
      className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4"
    >
      {shown.map(({ c, count }) => (
        <Link
          key={c.slug}
          href={categoryPath(prefix, c.slug)}
          className="flex w-24 shrink-0 flex-col items-center gap-1.5 rounded-lg bg-surface px-2 py-3 text-center shadow-sm ring-1 ring-line-soft"
        >
          <span className="flex size-11 items-center justify-center rounded-full bg-brand-soft text-brand">
            <CategoryIcon name={c.icon} size={20} />
          </span>
          <span className="text-[13px] leading-tight font-semibold">
            {lang === "en" ? c.nameEn : c.name}
          </span>
          <span className="text-[11px] font-bold text-dim">
            {t.home.models(num(count))}
          </span>
        </Link>
      ))}
      <Link
        href={`${prefix}/search/`}
        className="flex w-24 shrink-0 flex-col items-center justify-center gap-1.5 rounded-lg bg-surface px-2 py-3 text-center shadow-sm ring-1 ring-line-soft"
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
    </nav>
  );
}
