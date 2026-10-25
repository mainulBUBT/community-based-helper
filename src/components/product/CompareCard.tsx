"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { SellerLogo } from "@/components/seller/SellerLogo";
import { useI18n } from "@/hooks/useI18n";
import type { ComparePick } from "@/services/catalog-core";
import { formatTaka } from "@/utils/format";
import { ProductIcon } from "./ProductIcon";

export function CompareCard({ pick }: { pick: ComparePick | null }) {
  const { t, num, lang, prefix } = useI18n();
  if (!pick) return null;
  const { product, compareAt } = pick.summary;
  const photo = product.images?.[0];
  const lowestPrice = Math.min(...pick.offers.map((o) => o.price));
  const highestPrice = Math.max(...pick.offers.map((o) => o.price));
  const saving = compareAt ? compareAt - lowestPrice : 0;
  const offPercent = compareAt ? Math.round((saving / compareAt) * 100) : 0;

  return (
    <aside className="flex flex-col gap-4 rounded-xl border border-line bg-surface p-5 shadow-lift">
      <div className="flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-2 rounded-xs border border-brand/25 bg-brand-soft px-2.5 py-1.5 text-[11px] font-bold text-brand-text">
          <span className="size-1.5 rounded-full bg-ok" aria-hidden="true" />
          {t.home.compareEyebrow}
        </span>
        {saving > 0 && (
          <span className="rounded-xs bg-gold-soft px-2 py-1 text-[11px] font-bold text-gold-text">
            {offPercent > 0 ? t.home.compareOff(num(offPercent)) : t.home.compareSaved(num(saving.toLocaleString(lang === "bn" ? "bn-BD" : "en-IN")))}
          </span>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="flex size-22 shrink-0 items-center justify-center rounded-md border border-line-soft bg-white">
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo} alt={`${product.brand} ${product.name}`} loading="lazy" className="size-full object-contain p-2" />
          ) : (
            <ProductIcon product={product} size="fill" plain />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <span className="text-[10px] font-bold tracking-widest text-faint uppercase">
            {product.brand}
          </span>
          <Link
            href={`${prefix}/product/${product.slug}/`}
            className="mt-0.5 block line-clamp-2 text-[15px] leading-snug font-bold tracking-tight hover:text-brand"
          >
            {product.name}
          </Link>
          {pick.variantLabel && (
            <span className="mt-0.5 block truncate text-[11px] text-dim">
              {pick.variantLabel}
            </span>
          )}
          <div className="mt-1.5 flex flex-wrap items-baseline gap-x-2">
            <span className="text-xl font-bold tracking-tight">
              {formatTaka(lowestPrice, lang)}
            </span>
            {compareAt && (
              <span className="text-xs text-faint line-through">{formatTaka(compareAt, lang)}</span>
            )}
          </div>
        </div>
      </div>

      <ul className="flex flex-col divide-y divide-line-soft border-t border-line-soft pt-1">
        {pick.offers.map((offer) => {
          const best = offer.price === lowestPrice;
          return (
            <li key={offer.id}>
              <Link
                href={`${prefix}/product/${product.slug}/`}
                className="flex h-9 items-center gap-2.5 rounded-xs px-1.5 transition-colors hover:bg-surface-2"
              >
                <SellerLogo seller={offer.seller} size={22} />
                <span className={`min-w-0 flex-1 truncate text-[13px] ${best ? "font-semibold text-brand" : "text-dim"}`}>
                  {offer.seller.name}
                </span>
                <span className={`shrink-0 text-[13px] font-bold tabular-nums ${best ? "text-brand" : ""}`}>
                  {formatTaka(offer.price, lang)}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="mt-auto flex items-center justify-between gap-3 border-t border-line-soft pt-3 text-xs text-dim">
        <span className="truncate">
          {t.home.compareFound(num(pick.summary.sellerCount))}
          {highestPrice > lowestPrice && (
            <span className="ms-1.5 text-faint">{formatTaka(highestPrice - lowestPrice, lang)}</span>
          )}
        </span>
        <Link
          href={`${prefix}/product/${product.slug}/`}
          className="flex shrink-0 items-center gap-0.5 font-bold text-brand hover:text-brand-hover"
        >
          {t.home.compareSeeAll}
          <ChevronRight size={14} aria-hidden="true" />
        </Link>
      </div>
    </aside>
  );
}
