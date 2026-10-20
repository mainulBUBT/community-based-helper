"use client";

import { ExternalLink, Phone, Tag } from "lucide-react";
import Link from "next/link";
import { SellerLogo } from "@/components/seller/SellerLogo";
import { VerifiedBadge } from "@/components/seller/VerifiedBadge";
import { Badge } from "@/components/ui/Badge";
import { useI18n } from "@/hooks/useI18n";
import type { OfferView } from "@/types/catalog";
import { formatTaka, telLink } from "@/utils/format";

function OfferRow({ offer, best }: { offer: OfferView; best: boolean }) {
  const { t, ago, prefix } = useI18n();
  const { seller } = offer;
  const link = offer.url ?? seller.website;
  const stock = offer.inStock === null ? t.stock.unknown : offer.inStock ? t.stock.yes : t.stock.no;
  const stockDot = offer.inStock === null ? "bg-faint" : offer.inStock ? "bg-ok" : "bg-danger";

  return (
    <li className={`grid gap-2.5 px-4 py-3.5 transition-colors md:grid-cols-[minmax(0,1fr)_minmax(0,17rem)_auto] md:items-center md:gap-4 ${best ? "bg-brand-soft" : "hover:bg-surface-2/60"}`}>
      <div className="order-1 flex min-w-0 items-center gap-3">
        <SellerLogo seller={seller} />
        <span className="flex min-w-0 flex-col gap-1">
          <span className="flex min-w-0 items-center gap-1.5">
            <Link href={`${prefix}/seller/${seller.id}/`} className="truncate font-bold hover:text-brand">
              {seller.name}
            </Link>
            <VerifiedBadge verified={seller.verified} />
          </span>
          {offer.condition !== "official" && (
            <span>
              <Badge tone="gold">
                {t.condition[offer.condition]}
                {offer.region ? ` (${offer.region})` : ""}
              </Badge>
            </span>
          )}
        </span>
      </div>

      <div className="order-3 flex min-w-0 flex-col gap-1 border-t border-line-soft pt-2 text-[13px] text-dim md:order-2 md:border-t-0 md:pt-0">
        <span className="flex items-center gap-1.5">
          <span className={`size-1.5 shrink-0 rounded-full ${stockDot}`} aria-hidden="true" />
          {stock}
          <span aria-hidden="true">·</span>
          <span className="truncate">
            {t.source[offer.source]} {ago(offer.checkedAt)}
          </span>
        </span>
        {offer.promos.map((promo) => (
          <span key={promo.id} className="flex items-start gap-1 font-semibold text-gold-text">
            <Tag size={13} className="mt-0.5 shrink-0" aria-hidden="true" />
            <span className="line-clamp-2">{promo.text}</span>
          </span>
        ))}
        {!link && seller.phone && (
          <span>
            {t.seller.phone}: <span className="font-bold tracking-wide text-ink">{seller.phone}</span>
          </span>
        )}
      </div>

      <div className="order-2 flex items-center justify-between gap-3 md:order-3 md:justify-end">
        <span className="flex flex-col items-start gap-1 md:items-end">
          {best && <span className="rounded bg-gold px-1.5 py-0.5 text-[11px] font-bold text-gold-ink">{t.product.cheapest}</span>}
          <span className="flex items-baseline gap-1.5">
            <span className="text-lg font-bold text-brand">{formatTaka(offer.price)}</span>
            {offer.oldPrice && offer.oldPrice > offer.price && <span className="text-sm text-dim line-through">{formatTaka(offer.oldPrice)}</span>}
          </span>
        </span>
        {link ? (
          <a href={link} target="_blank" rel="noopener nofollow" className="flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-brand px-4 text-sm font-bold text-brand-ink hover:bg-brand-hover">
            {t.product.goToStore}
            <ExternalLink size={15} aria-hidden="true" />
          </a>
        ) : (
          seller.phone && (
            <a href={telLink(seller.phone)} className="flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-brand px-4 text-sm font-bold text-brand-ink hover:bg-brand-hover">
              <Phone size={15} aria-hidden="true" />
              {t.seller.call}
            </a>
          )
        )}
      </div>
    </li>
  );
}

export function OffersTable({ offers }: { offers: OfferView[] }) {
  const { t } = useI18n();
  return (
    <div className="overflow-hidden rounded-lg bg-surface shadow-sm ring-1 ring-line">
      <div className="hidden grid-cols-[minmax(0,1fr)_minmax(0,17rem)_auto] gap-4 px-4 pb-2 pt-3.5 text-[13px] font-semibold text-dim md:grid">
        <span>{t.product.storeCol}</span>
        <span />
        <span className="text-right">{t.product.priceCol}</span>
      </div>
      <ul className="divide-y divide-line-soft">
        {offers.map((offer, i) => (
          <OfferRow key={offer.id} offer={offer} best={i === 0} />
        ))}
      </ul>
    </div>
  );
}
