"use client";

import { Tag } from "lucide-react";
import Link from "next/link";
import { SellerContact } from "@/components/seller/SellerContact";
import { VerifiedBadge } from "@/components/seller/VerifiedBadge";
import { Badge } from "@/components/ui/Badge";
import { useI18n } from "@/hooks/useI18n";
import type { OfferView } from "@/types/catalog";
import { formatTaka } from "@/utils/format";

export function OfferCard({ offer, best }: { offer: OfferView; best: boolean }) {
  const { t, ago } = useI18n();
  const { seller } = offer;
  const stock = offer.inStock === null ? t.stock.unknown : offer.inStock ? t.stock.yes : t.stock.no;
  return (
    <article className={`flex flex-col gap-3 rounded-md bg-surface p-4 shadow-sm ring-1 ${best ? "ring-2 ring-brand" : "ring-line-soft"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1.5">
          <Link href={`/seller/${seller.id}/`} className="truncate text-base font-bold hover:text-brand">
            {seller.name}
          </Link>
          <div className="flex flex-wrap gap-1.5">
            <VerifiedBadge verified={seller.verified} />
            <Badge>{t.sellerKind[seller.kind]}</Badge>
            {offer.condition !== "official" && (
              <Badge tone="gold">
                {t.condition[offer.condition]}
                {offer.region ? ` (${offer.region})` : ""}
              </Badge>
            )}
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end">
          {best && <span className="rounded bg-brand px-1.5 py-0.5 text-[11px] font-bold text-brand-ink">{t.product.cheapest}</span>}
          <span className="text-xl font-bold">{formatTaka(offer.price)}</span>
          {offer.oldPrice && offer.oldPrice > offer.price && <span className="text-xs text-dim line-through">{formatTaka(offer.oldPrice)}</span>}
        </div>
      </div>

      {offer.promos.map((promo) => (
        <p key={promo.id} className="flex items-start gap-2 rounded-lg bg-gold-soft px-3 py-2 text-[13px] font-semibold text-gold-text">
          <Tag size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
          {promo.text}
        </p>
      ))}

      <p className="text-[13px] text-dim">
        {stock}, {t.source[offer.source]} {ago(offer.checkedAt)}
      </p>

      <SellerContact seller={seller} url={offer.url} />
    </article>
  );
}
