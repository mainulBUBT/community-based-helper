"use client";

import Link from "next/link";
import { SaveButton } from "@/components/product/SaveButton";
import { useI18n } from "@/hooks/useI18n";
import type { ProductSummary } from "@/types/catalog";
import { formatTaka } from "@/utils/format";
import { ProductIcon } from "./ProductIcon";

export function ProductCard({ summary }: { summary: ProductSummary }) {
  const { t, num } = useI18n();
  const { product, lowest, sellerCount, drop } = summary;
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-md bg-surface shadow-sm ring-1 ring-line-soft transition-shadow hover:shadow-md">
      <div className="relative flex aspect-[4/3] items-center justify-center bg-surface-2">
        {drop && <span className="absolute top-2 left-2 rounded-md bg-gold px-2 py-0.5 text-xs font-bold text-gold-ink">−{formatTaka(drop)}</span>}
        <span className="absolute top-1.5 right-1.5">
          <SaveButton slug={product.slug} compact />
        </span>
        <ProductIcon product={product} size="lg" plain />
      </div>
      <Link href={`/product/${product.slug}/`} className="flex flex-1 flex-col gap-1 p-3 after:absolute after:inset-0">
        <span className="text-xs font-medium text-dim">{product.brand}</span>
        <span className="line-clamp-2 min-h-[2.5em] text-sm leading-snug font-semibold group-hover:text-brand">{product.name}</span>
        <span className="mt-1 text-lg font-bold text-ink">{lowest ? formatTaka(lowest) : t.product.noPrice}</span>
        <span className="text-xs text-dim">{t.product.stores(num(sellerCount))}</span>
      </Link>
    </article>
  );
}
