"use client";

import Link from "next/link";
import { useState } from "react";
import { CategoryIcon } from "@/components/product/CategoryIcon";
import { ProductIcon } from "@/components/product/ProductIcon";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { useCategories } from "@/hooks/useCategories";
import { useI18n } from "@/hooks/useI18n";
import type { CategoryInfo, ProductSummary } from "@/types/catalog";
import { formatTaka } from "@/utils/format";
import { categoryPath } from "@/utils/url";
import { SectionEyebrow } from "./Shelf";

export function SpotlightShelf({ summaries }: { summaries: ProductSummary[] }) {
  const { t, num, lang, prefix } = useI18n();
  const { top, family } = useCategories();
  const withProducts = top.filter((c) =>
    summaries.some((s) => family(c.slug).includes(s.product.category)),
  );
  const [active, setActive] = useState(withProducts[0]?.slug ?? "");
  const current =
    withProducts.find((c) => c.slug === active) ?? withProducts[0];
  if (!current) return null;
  const items = summaries.filter((s) =>
    family(current.slug).includes(s.product.category),
  );
  const ranked = [...items]
    .sort(
      (a, b) =>
        b.product.popularity +
        b.sellerCount * 5 -
        (a.product.popularity + a.sellerCount * 5),
    )
    .slice(0, 5);
  const label = (c: CategoryInfo) => (lang === "en" ? c.nameEn : c.name);

  return (
    <section className="flex flex-col gap-5 rounded-lg bg-surface p-4 shadow-sm ring-1 ring-line-soft md:p-6">
      <div className="flex flex-col gap-3">
        <SectionEyebrow>
          {t.home.spotlightEyebrow(label(current))}
        </SectionEyebrow>
        <SectionHeader
          title={t.home.spotlight}
          subtitle={t.home.spotlightSub}
          href={categoryPath(prefix, current.slug)}
          linkLabel={t.home.seeAllIn(num(items.length))}
        />
      </div>
      <div className="grid grid-cols-3 gap-2 md:flex md:flex-wrap">
        {withProducts.map((c) => (
          <button
            key={c.slug}
            type="button"
            aria-pressed={c.slug === current.slug}
            onClick={() => setActive(c.slug)}
            className={`flex h-9 min-w-0 items-center justify-center gap-1.5 rounded-full border px-2 text-[13px] font-semibold transition-colors md:gap-2 md:px-4 md:text-sm ${c.slug === current.slug ? "border-brand bg-brand text-brand-ink" : "border-line bg-surface hover:border-brand"}`}
          >
            <CategoryIcon name={c.icon} size={15} />
            {label(c)}
          </button>
        ))}
      </div>
      <ol className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {ranked.map(({ product, lowest, sellerCount }, i) => (
          <li key={product.id}>
            <Link
              href={`${prefix}/product/${product.slug}/`}
              className="group flex h-full flex-col gap-3 rounded-lg border border-line-soft p-3 transition-colors hover:border-brand"
            >
              <div className="flex items-start justify-between">
                <span
                  className={`text-xl leading-none font-bold ${i === 0 ? "text-gold" : "text-faint"}`}
                >
                  #{num(i + 1)}
                </span>
                <span className="rounded bg-surface-2 px-1.5 py-0.5 text-[11px] font-semibold text-dim">
                  {t.home.shopsAt(num(sellerCount))}
                </span>
              </div>
              <div className="flex aspect-square items-center justify-center">
                <ProductIcon product={product} size="fill" plain />
              </div>
              <div className="flex flex-1 flex-col gap-1">
                <span className="text-[11px] font-semibold tracking-wider text-dim uppercase">
                  {product.brand}
                </span>
                <span className="line-clamp-2 text-sm font-semibold group-hover:text-brand">
                  {product.name}
                </span>
              </div>
              {lowest && (
                <span className="flex flex-col">
                  <span className="text-[11px] text-dim">
                    {t.home.bestPrice}
                  </span>
                  <span className="text-base font-bold tracking-tight">
                    {formatTaka(lowest, lang)}
                  </span>
                </span>
              )}
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
