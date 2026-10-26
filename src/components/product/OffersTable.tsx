"use client";

import { ExternalLink, Phone, Tag } from "lucide-react";
import Link from "next/link";
import { SellerLogo } from "@/components/seller/SellerLogo";
import { VerifiedBadge } from "@/components/seller/VerifiedBadge";
import { Badge } from "@/components/ui/Badge";
import { useI18n } from "@/hooks/useI18n";
import type { Condition, OfferView } from "@/types/catalog";
import { conditionLabel } from "@/utils/categories";
import { formatTaka, telLink } from "@/utils/format";

const TONE: Partial<Record<Condition, "ok" | "gold" | "brand">> = { official: "ok", unofficial: "gold", replica_premium: "brand" };

function OfferRow({ offer, best, warranty, showCondition }: { offer: OfferView; best: boolean; warranty: boolean; showCondition: boolean }) {
  const { t, ago, lang, prefix } = useI18n();
  const { seller } = offer;
  const link = offer.url ?? seller.website;
  const stock = offer.inStock === null ? t.stock.unknown : offer.inStock ? t.stock.yes : t.stock.no;
  const stockDot = offer.inStock === null ? "bg-faint" : offer.inStock ? "bg-ok" : "bg-danger";
  const action = `flex h-9 shrink-0 items-center gap-1.5 rounded-md px-3 text-[13px] font-semibold transition-colors md:h-10 md:px-4 md:text-sm ${best ? "bg-cta text-cta-ink hover:bg-cta-hover" : "border border-line text-ink hover:border-dim"}`;

  return (
    <li className={`grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2.5 px-4 py-3.5 md:grid-cols-[minmax(0,1fr)_auto_auto] md:gap-x-5 md:px-5 md:py-4 ${best ? "bg-ok-soft/40" : ""}`}>
      <div className="col-start-1 row-start-1 flex min-w-0 items-center gap-3">
        <SellerLogo seller={seller} />
        <span className="flex min-w-0 flex-col items-start gap-1 md:flex-row md:items-center md:gap-2">
          <span className="flex max-w-full min-w-0 items-center gap-1.5">
            <Link href={`${prefix}/seller/${seller.id}/`} className="truncate font-semibold text-ink hover:text-brand">
              {seller.name}
            </Link>
            <VerifiedBadge verified={seller.verified} />
          </span>
          {showCondition ? (
            <Badge tone={TONE[offer.condition] ?? "neutral"}>
              {conditionLabel(t, offer.condition, warranty)}
              {offer.region ? ` (${offer.region})` : ""}
            </Badge>
          ) : (
            offer.region && <Badge tone="neutral">{offer.region}</Badge>
          )}
        </span>
      </div>

      <div className="col-start-1 row-start-2 flex min-w-0 flex-col gap-1 pl-10">
        <span className="flex items-center gap-1.5 text-[13px] text-dim">
          <span className={`size-1.5 shrink-0 rounded-full ${stockDot}`} aria-hidden="true" />
          <span className="truncate">
            {stock}, {ago(offer.checkedAt)}
          </span>
        </span>
        {!link && seller.phone && <span className="text-[13px] font-semibold text-ink">{seller.phone}</span>}
        {offer.promos.map((promo) => (
          <span key={promo.id} className="flex items-start gap-1 text-[13px] font-medium text-gold-text">
            <Tag size={13} className="mt-0.5 shrink-0" aria-hidden="true" />
            <span className="line-clamp-1">{promo.text}</span>
          </span>
        ))}
      </div>

      <span className="col-start-2 row-start-1 flex flex-col items-end md:row-span-2 md:self-center">
        {best && <span className="text-[11px] font-semibold text-ok">{t.product.cheapest}</span>}
        <span className="text-[17px] leading-tight font-bold tracking-tight text-ink md:text-lg">{formatTaka(offer.price, lang)}</span>
        {offer.oldPrice && offer.oldPrice > offer.price && <span className="text-xs text-faint line-through">{formatTaka(offer.oldPrice, lang)}</span>}
      </span>

      <div className="col-start-2 row-start-2 justify-self-end md:col-start-3 md:row-span-2 md:row-start-1 md:self-center">
        {link ? (
          <a href={link} target="_blank" rel="noopener nofollow" className={action}>
            {t.product.goToStore}
            <ExternalLink size={14} aria-hidden="true" />
          </a>
        ) : (
          seller.phone && (
            <a href={telLink(seller.phone)} className={action}>
              <Phone size={14} aria-hidden="true" />
              {t.seller.call}
            </a>
          )
        )}
      </div>
    </li>
  );
}

export function OffersTable({ offers, warranty, showCondition }: { offers: OfferView[]; warranty: boolean; showCondition: boolean }) {
  const lowest = offers.length ? Math.min(...offers.map((offer) => offer.price)) : null;
  return (
    <ul className="divide-y divide-line-soft">
      {offers.map((offer) => (
        <OfferRow key={offer.id} offer={offer} best={offer.price === lowest} warranty={warranty} showCondition={showCondition} />
      ))}
    </ul>
  );
}
