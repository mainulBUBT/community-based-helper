"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import type { ReactNode } from "react";
import { SaveButton } from "@/components/product/SaveButton";
import { useI18n } from "@/hooks/useI18n";
import type { ProductSummary } from "@/types/catalog";
import { formatTaka } from "@/utils/format";
import { ProductIcon } from "./ProductIcon";

interface ProductCardProps {
  summary: ProductSummary;
  deal?: number | null;
  badge?: ReactNode;
  category?: string;
  compact?: boolean;
}

export function ProductCard({ summary, deal, badge, category, compact }: ProductCardProps) {
  const { t, num, prefix } = useI18n();
  const { product, lowest, compareAt, inStock, sellerCount } = summary;
  const photo = product.images?.[0];
  const off = lowest && compareAt ? Math.round(((compareAt - lowest) / compareAt) * 100) : 0;

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-md border border-line bg-surface transition-[border-color,box-shadow,transform] hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-lift">
      <div className="relative flex aspect-square items-center justify-center bg-white p-4">
        {deal ? (
          <span className="absolute top-2.5 left-2.5 z-10 rounded-xs bg-gold px-1.5 py-0.5 text-[10px] font-bold text-gold-ink">
            {t.home.droppedBy(formatTaka(deal).replace("৳", ""))}
          </span>
        ) : off > 0 ? (
          <span className="absolute top-2.5 left-2.5 z-10 rounded-xs bg-sale px-1.5 py-0.5 text-[10px] font-bold text-white">
            −{num(off)}%
          </span>
        ) : null}
        {category && (
          <span className="absolute top-2.5 left-2.5 z-10 max-w-[calc(100%-1.25rem)] truncate rounded-xs border border-brand/25 bg-brand-soft/95 px-1.5 py-0.5 text-[9.5px] font-bold text-brand-text">
            {category}
          </span>
        )}
        <span className="absolute top-2.5 right-2.5 z-10 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100 md:focus-within:opacity-100">
          <SaveButton slug={product.slug} compact />
        </span>
        {badge && <span className="absolute bottom-2.5 left-2.5 z-10 max-w-[calc(100%-1.25rem)] overflow-hidden">{badge}</span>}
        {photo ? (
          <img src={photo} alt={`${product.brand} ${product.name}`} loading="lazy" className="size-full object-contain transition-transform duration-300 group-hover:scale-[1.04]" />
        ) : (
          <ProductIcon product={product} size="lg" plain />
        )}
      </div>

      <div className="flex flex-1 flex-col border-t border-line-soft p-3">
        <span className="text-[9.5px] font-bold tracking-widest text-faint uppercase">{product.brand}</span>
        <Link
          href={`${prefix}/product/${product.slug}/`}
          className={`mt-1 line-clamp-2 font-semibold text-ink after:absolute after:inset-0 hover:text-brand ${compact ? "text-[11.5px] leading-[1.42]" : "min-h-[2.5rem] text-sm leading-5"}`}
        >
          {product.name}
        </Link>
        <div className="mt-2 flex flex-wrap items-baseline gap-x-2">
          <span className={`font-bold tracking-tight text-ink ${compact ? "text-[13.5px]" : "text-base"}`}>
            {lowest ? formatTaka(lowest) : t.product.noPrice}
          </span>
          {compareAt && (
            <span className="text-[11px] text-faint line-through">{formatTaka(compareAt)}</span>
          )}
        </div>
        <div className="mt-auto flex min-w-0 items-center gap-1.5 pt-2 text-[11px] whitespace-nowrap text-dim" title={inStock ? t.stock.yes : t.stock.unknown}>
          <span className={`size-1.5 shrink-0 rounded-full ${inStock ? "bg-ok" : "bg-faint"}`} aria-hidden="true" />
          <span className="truncate">{t.product.stores(num(sellerCount))}</span>
        </div>
      </div>
    </article>
  );
}
