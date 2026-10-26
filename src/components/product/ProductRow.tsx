"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { useI18n } from "@/hooks/useI18n";
import type { ProductSummary } from "@/types/catalog";
import { isReplica } from "@/utils/categories";
import { formatTaka } from "@/utils/format";
import { ProductIcon } from "./ProductIcon";

export function ProductRow({ summary }: { summary: ProductSummary }) {
  const { t, num, prefix, lang } = useI18n();
  const { product, lowest, condition, sellerCount, drop } = summary;
  const details = [condition && isReplica(condition) ? t.condition.replica : null, product.variants.length > 1 ? t.product.variants(num(product.variants.length)) : null, t.product.stores(num(sellerCount))];
  return (
    <Link href={`${prefix}/product/${product.slug}/`} className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-2">
      <ProductIcon product={product} size="sm" />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-xs text-dim">{product.brand}</span>
        <span className="truncate text-[15px] font-semibold group-hover:text-brand">{product.name}</span>
        <span className="text-xs text-dim">{details.filter(Boolean).join(", ")}</span>
      </span>
      <span className="flex flex-col items-end gap-1">
        <span className="text-base font-bold">{lowest ? formatTaka(lowest, lang) : t.product.none}</span>
        {drop ? <span className="rounded bg-gold-soft px-1.5 text-xs font-bold text-gold-text">−{formatTaka(drop, lang)}</span> : <span className="text-xs text-dim">{t.product.from}</span>}
      </span>
      <ChevronRight size={18} className="text-faint" aria-hidden="true" />
    </Link>
  );
}
