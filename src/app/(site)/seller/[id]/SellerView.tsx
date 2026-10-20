"use client";

import { Tag } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { ProductIcon } from "@/components/product/ProductIcon";
import { SellerContact } from "@/components/seller/SellerContact";
import { VerifiedBadge } from "@/components/seller/VerifiedBadge";
import { Badge } from "@/components/ui/Badge";
import { useAsync } from "@/hooks/useAsync";
import { useI18n } from "@/hooks/useI18n";
import { getSellerDetail } from "@/services/catalog";
import { formatTaka } from "@/utils/format";

type Detail = NonNullable<Awaited<ReturnType<typeof getSellerDetail>>>;

export function SellerView({ initial }: { initial: Detail }) {
  const { t, ago, prefix } = useI18n();
  const { data } = useAsync(() => getSellerDetail(initial.seller.id), [initial.seller.id], initial);
  const { seller, listings, promos } = data ?? initial;

  return (
    <div className="flex flex-col gap-5">
      <PageHeader />

      <section className="flex flex-col gap-4 rounded-lg border border-line-soft bg-surface p-5">
        <div className="flex flex-col gap-2">
          <h1 className="flex flex-wrap items-center gap-2 text-2xl font-bold">
            {seller.name}
            <VerifiedBadge verified={seller.verified} />
          </h1>
          <div className="flex flex-wrap gap-1.5">
            <Badge>{t.sellerKind[seller.kind]}</Badge>
            {seller.area && <Badge>{seller.area}</Badge>}
          </div>
        </div>
        {!seller.verified && <p className="rounded-md bg-gold-soft px-3 py-2 text-[13px] font-semibold text-gold-text">{t.seller.unverifiedWarning}</p>}
        <SellerContact seller={seller} />
        {seller.facebook && (
          <a href={seller.facebook} target="_blank" rel="noopener nofollow" className="text-sm font-semibold text-brand">
            {t.seller.facebook}
          </a>
        )}
      </section>

      {promos.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-lg font-bold">{t.seller.promos}</h2>
          {promos.map((promo) => (
            <p key={promo.id} className="flex items-start gap-2 rounded-md bg-gold-soft px-3 py-2.5 text-sm font-semibold text-gold-text">
              <Tag size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
              {[promo.text, promo.scope, promo.endsOn && t.seller.until(promo.endsOn)].filter(Boolean).join(", ")}
            </p>
          ))}
        </section>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-bold">{t.seller.listings}</h2>
        <div className="divide-y divide-line-soft overflow-hidden rounded-lg border border-line-soft bg-surface">
          {listings.map(({ offer, product, variant }) => (
            <Link key={offer.id} href={`${prefix}/product/${product.slug}/`} className="flex items-center gap-3 px-4 py-3 hover:bg-surface-2/60">
              <ProductIcon product={product} size="sm" />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate font-semibold">
                  {product.brand} {product.name}
                </span>
                <span className="text-[13px] text-dim">{[variant.label, t.condition[offer.condition], ago(offer.checkedAt)].join(", ")}</span>
              </span>
              <span className="font-bold">{formatTaka(offer.price)}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
