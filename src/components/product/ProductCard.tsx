"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { SaveButton } from "@/components/product/SaveButton";
import { useI18n } from "@/hooks/useI18n";
import type { ProductSummary } from "@/types/catalog";
import { formatTaka } from "@/utils/format";
import { ProductIcon } from "./ProductIcon";

export function ProductCard({ summary, deal }: { summary: ProductSummary; deal?: number | null }) {
  const { t, num, prefix } = useI18n();
  const { product, lowest, compareAt, inStock, sellerCount } = summary;
  const photo = product.images?.[0];
  const off = lowest && compareAt ? Math.round(((compareAt - lowest) / compareAt) * 100) : 0;

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-lg border border-line bg-surface transition-[border-color,box-shadow] hover:border-brand/30 hover:shadow-[0_8px_24px_-12px_rgb(17_24_39/0.25)]">
      <div className="relative flex aspect-square items-center justify-center bg-white">
        {deal ? (
          <span className="absolute top-2 left-2 z-10 rounded bg-gold px-1.5 py-0.5 text-[11px] font-semibold text-gold-ink">−{formatTaka(deal)}</span>
        ) : off > 0 ? (
          <span className="absolute top-2 left-2 z-10 rounded bg-sale px-1.5 py-0.5 text-[11px] font-semibold text-white">−{num(off)}%</span>
        ) : null}
        <span className="absolute top-2 right-2 z-10 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100 md:focus-within:opacity-100">
          <SaveButton slug={product.slug} compact />
        </span>
        {photo ? (
          <img src={photo} alt={`${product.brand} ${product.name}`} loading="lazy" className="size-full object-contain p-4 transition-transform duration-300 group-hover:scale-[1.03]" />
        ) : (
          <ProductIcon product={product} size="lg" plain />
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1 border-t border-line-soft p-3">
        <span className="text-[11px] font-semibold tracking-wider text-faint uppercase">{product.brand}</span>
        <Link
          href={`${prefix}/product/${product.slug}/`}
          className="line-clamp-2 min-h-[2.5rem] text-sm leading-5 font-medium text-ink after:absolute after:inset-0 hover:text-brand"
        >
          {product.name}
        </Link>
        <div className="mt-1 flex flex-wrap items-baseline gap-x-2">
          <span className="text-base font-bold tracking-tight text-ink">{lowest ? formatTaka(lowest) : t.product.noPrice}</span>
          {compareAt && <span className="text-xs text-faint line-through">{formatTaka(compareAt)}</span>}
        </div>
        <div className="mt-auto flex min-w-0 items-center gap-1.5 pt-2 text-xs whitespace-nowrap text-dim" title={inStock ? t.stock.yes : t.stock.unknown}>
          <span className={`size-1.5 shrink-0 rounded-full ${inStock ? "bg-ok" : "bg-faint"}`} aria-hidden="true" />
          <span className="truncate">{t.product.stores(num(sellerCount))}</span>
        </div>
      </div>
    </article>
  );
}
