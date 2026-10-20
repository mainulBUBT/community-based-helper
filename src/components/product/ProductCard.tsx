"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { SaveButton } from "@/components/product/SaveButton";
import { useI18n } from "@/hooks/useI18n";
import type { ProductSummary } from "@/types/catalog";
import { formatTaka } from "@/utils/format";
import { ProductIcon } from "./ProductIcon";

export function ProductCard({ summary }: { summary: ProductSummary }) {
  const { t, num, prefix } = useI18n();
  const { product, lowest, sellerCount, drop } = summary;
  const photo = product.images?.[0];
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-md bg-surface shadow-sm ring-1 ring-line transition-shadow hover:shadow-md">
      <div className="relative flex aspect-[4/3] items-center justify-center border-b border-line-soft bg-surface">
        {drop && <span className="absolute top-2 left-2 rounded-md bg-gold px-2 py-0.5 text-xs font-bold text-gold-ink">−{formatTaka(drop)}</span>}
        <span className="absolute top-1.5 right-1.5">
          <SaveButton slug={product.slug} compact />
        </span>
        {photo ? (
          <img src={photo} alt={`${product.brand} ${product.name}`} loading="lazy" className="size-full object-contain p-3" />
        ) : (
          <ProductIcon product={product} size="lg" plain />
        )}
      </div>
      <Link href={`${prefix}/product/${product.slug}/`} className="flex flex-1 flex-col gap-1 p-3 after:absolute after:inset-0">
        <span className="text-xs font-medium text-dim">{product.brand}</span>
        <span className="line-clamp-2 min-h-[2.5em] text-sm leading-snug font-semibold group-hover:text-brand">{product.name}</span>
        <span className="mt-1 text-lg font-bold text-ink">{lowest ? formatTaka(lowest) : t.product.noPrice}</span>
        <span className="text-xs text-dim">{t.product.stores(num(sellerCount))}</span>
      </Link>
    </article>
  );
}
