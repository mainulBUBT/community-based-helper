"use client";

import { ChevronRight, ExternalLink, Tag } from "lucide-react";
import Link from "next/link";
import { ProductIcon } from "@/components/product/ProductIcon";
import { SellerContact } from "@/components/seller/SellerContact";
import { SellerLogo } from "@/components/seller/SellerLogo";
import { VerifiedBadge } from "@/components/seller/VerifiedBadge";
import { Panel } from "@/components/ui/Panel";
import { useCategories } from "@/hooks/useCategories";
import { useI18n } from "@/hooks/useI18n";
import type { getSellerDetail } from "@/services/catalog.server";
import type { Condition } from "@/types/catalog";
import { conditionLabel } from "@/utils/categories";
import { formatTaka } from "@/utils/format";

type Detail = NonNullable<Awaited<ReturnType<typeof getSellerDetail>>>;
type Listing = Detail["listings"][number];

const byProduct = (listings: Listing[]) => [
  ...listings.reduce((groups, listing) => groups.set(listing.product.id, [...(groups.get(listing.product.id) ?? []), listing]), new Map<string, Listing[]>()).values(),
];

export function SellerView({ initial }: { initial: Detail }) {
  const { t, num, ago, prefix, lang } = useI18n();
  const { warranty, conditions } = useCategories();
  const { seller, listings, promos } = initial;
  const groups = byProduct(listings);
  const latest = listings.reduce<string | null>((max, { offer }) => (!max || offer.checkedAt > max ? offer.checkedAt : max), null);
  const meta = [t.sellerKind[seller.kind], groups.length ? t.seller.products(num(groups.length)) : null].filter(Boolean).join(" · ");

  return (
    <div className="flex flex-col gap-5">
      <nav aria-label="breadcrumb" className="flex flex-wrap items-center gap-1 text-[13px] text-dim">
        <Link href={`${prefix}/`} className="hover:text-brand">
          {t.nav.home}
        </Link>
        <ChevronRight size={13} aria-hidden="true" />
        <Link href={`${prefix}/sellers/`} className="hover:text-brand">
          {t.nav.sellers}
        </Link>
        <ChevronRight size={13} aria-hidden="true" />
        <span className="text-ink">{seller.name}</span>
      </nav>

      <section className="flex flex-col gap-4 rounded-lg border border-line bg-surface p-4 md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-6">
          <div className="flex min-w-0 flex-1 items-center gap-4">
            <SellerLogo seller={seller} size={64} />
            <div className="flex min-w-0 flex-col gap-1">
              <h1 className="flex flex-wrap items-center gap-2 text-xl font-bold md:text-2xl">
                {seller.name}
                <VerifiedBadge verified={seller.verified} size={20} />
              </h1>
              <p className="text-sm text-dim">{meta}</p>
            </div>
          </div>
          {(seller.website || seller.facebook) && (
            <div className="grid gap-2 md:w-72 md:shrink-0">
              {seller.website && (
                <a
                  href={seller.website}
                  target="_blank"
                  rel="noopener nofollow"
                  className="flex h-11 items-center justify-center gap-2 rounded-md bg-cta px-5 text-[15px] font-semibold text-cta-ink transition-colors hover:bg-cta-hover"
                >
                  {t.product.goToStore}
                  <ExternalLink size={16} aria-hidden="true" />
                </a>
              )}
              {seller.facebook && (
                <a href={seller.facebook} target="_blank" rel="noopener nofollow" className="text-center text-sm font-semibold text-brand">
                  {t.seller.facebook}
                </a>
              )}
            </div>
          )}
        </div>
        <SellerContact seller={seller} />
      </section>

      {!seller.verified && <p className="rounded-md bg-gold-soft px-3 py-2 text-[13px] font-semibold text-gold-text">{t.seller.unverifiedWarning}</p>}

      {promos.length > 0 && (
        <Panel title={t.seller.promos}>
          <div className="flex flex-col gap-2 p-4 md:p-5">
            {promos.map((promo) => (
              <p key={promo.id} className="flex items-start gap-2 rounded-md bg-gold-soft px-3 py-2.5 text-sm font-semibold text-gold-text">
                <Tag size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
                {[promo.text, promo.scope, promo.endsOn && t.seller.until(promo.endsOn)].filter(Boolean).join(", ")}
              </p>
            ))}
          </div>
        </Panel>
      )}

      {groups.length > 0 && (
        <Panel title={t.seller.listings} subtitle={[t.seller.products(num(groups.length)), latest && t.product.updated(ago(latest))].filter(Boolean).join(" · ")}>
          <div className="-mb-px grid lg:grid-cols-2">
            {groups.map((items) => {
              const { product } = items[0];
              const condition = (c: Condition) => (conditions(product.category).length > 1 ? conditionLabel(t, c, warranty(product.category)) : null);
              const shared = items.every(({ offer }) => offer.condition === items[0].offer.condition) ? condition(items[0].offer.condition) : null;
              return (
                <Link
                  key={product.id}
                  href={`${prefix}/product/${product.slug}/`}
                  className="group flex items-start gap-3 border-b border-line-soft px-4 py-3 transition-colors hover:bg-surface-2 md:px-5 lg:odd:border-r"
                >
                  <ProductIcon product={product} size="sm" />
                  <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <span className="flex min-w-0 flex-col">
                      <span className="text-xs text-dim">{[product.brand, shared].filter(Boolean).join(" · ")}</span>
                      <span className="truncate text-[15px] font-semibold group-hover:text-brand">{product.name}</span>
                    </span>
                    <span className="flex flex-wrap gap-1.5">
                      {items.map(({ offer, variant }) => {
                        const label = [variant.label, !shared && condition(offer.condition)].filter(Boolean).join(", ");
                        return (
                          <span key={offer.id} className="inline-flex items-center gap-1.5 rounded-md bg-surface-2 px-2 py-0.5 text-xs">
                            {label && <span className="text-dim">{label}</span>}
                            <span className="font-bold text-ink">{formatTaka(offer.price, lang)}</span>
                          </span>
                        );
                      })}
                    </span>
                  </span>
                  <ChevronRight size={18} className="shrink-0 self-center text-faint" aria-hidden="true" />
                </Link>
              );
            })}
          </div>
        </Panel>
      )}
    </div>
  );
}
