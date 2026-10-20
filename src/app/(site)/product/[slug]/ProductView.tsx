"use client";

import { ChevronRight, ExternalLink, Megaphone, Phone, Share2, Store } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { SubmitPriceDialog } from "@/components/forms/SubmitPriceDialog";
import { OfferCard } from "@/components/product/OfferCard";
import { PriceChart } from "@/components/product/PriceChart";
import { ProductIcon } from "@/components/product/ProductIcon";
import { SaveButton } from "@/components/product/SaveButton";
import { VerifiedBadge } from "@/components/seller/VerifiedBadge";
import { Chip } from "@/components/ui/Chip";
import { EmptyState } from "@/components/ui/EmptyState";
import { useAsync } from "@/hooks/useAsync";
import { useI18n } from "@/hooks/useI18n";
import { sharePage } from "@/lib/share";
import { getProductDetail } from "@/services/catalog";
import type { Condition, OfferView, ProductDetail } from "@/types/catalog";
import { formatTaka, telLink } from "@/utils/format";

const CONDITIONS: Condition[] = ["official", "unofficial", "used"];

function BuyButton({ offer, className = "" }: { offer: OfferView; className?: string }) {
  const { t } = useI18n();
  const link = offer.url ?? offer.seller.website;
  const base = `flex h-12 items-center justify-center gap-2 rounded-lg bg-gold px-6 font-bold text-gold-ink hover:brightness-95 ${className}`;
  if (link) {
    return (
      <a href={link} target="_blank" rel="noopener nofollow" className={base}>
        {t.product.goToStore}
        <ExternalLink size={17} aria-hidden="true" />
      </a>
    );
  }
  if (!offer.seller.phone) return null;
  return (
    <a href={telLink(offer.seller.phone)} className={base}>
      <Phone size={17} aria-hidden="true" />
      {t.seller.call}
    </a>
  );
}

export function ProductView({ initial }: { initial: ProductDetail }) {
  const { t, num, ago } = useI18n();
  const { data } = useAsync(() => getProductDetail(initial.product.slug), [initial.product.slug], initial);
  const { product, offers, history } = data ?? initial;
  const [variantId, setVariantId] = useState(product.variants[0]?.id);
  const variant = product.variants.find((v) => v.id === variantId) ?? product.variants[0];

  const variantOffers = offers.filter((o) => o.variantId === variant?.id);
  const conditions = CONDITIONS.filter((c) => variantOffers.some((o) => o.condition === c));
  const [chosen, setChosen] = useState<Condition>("official");
  const condition = conditions.includes(chosen) ? chosen : (conditions[0] ?? "official");
  const shown = variantOffers.filter((o) => o.condition === condition);
  const best = shown[0];
  const fullName = `${product.brand} ${product.name}`;

  return (
    <div className="flex flex-col gap-5 pb-20 md:pb-0">
      <nav aria-label="breadcrumb" className="flex flex-wrap items-center gap-1 text-sm text-dim">
        <Link href="/" className="hover:text-brand">
          {t.nav.home}
        </Link>
        <ChevronRight size={14} aria-hidden="true" />
        <Link href={`/search/?category=${product.category}`} className="hover:text-brand">
          {t.category[product.category].label}
        </Link>
        <ChevronRight size={14} aria-hidden="true" />
        <Link href={`/search/?brand=${encodeURIComponent(product.brand)}`} className="hover:text-brand">
          {product.brand}
        </Link>
      </nav>

      <div className="grid gap-5 rounded-lg bg-surface p-4 shadow-sm ring-1 ring-line-soft md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:p-6">
        <div className="relative flex aspect-[16/9] items-center justify-center rounded-md bg-surface-2 md:aspect-square">
          <ProductIcon product={product} size="lg" plain />
          <div className="absolute top-3 right-3 flex gap-2">
            <button type="button" aria-label={t.common.share} onClick={() => sharePage(fullName, t.common)} className="flex size-11 items-center justify-center rounded-lg border border-line bg-surface text-dim hover:text-brand">
              <Share2 size={19} aria-hidden="true" />
            </button>
            <SaveButton slug={product.slug} />
          </div>
        </div>

        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-1">
            <Link href={`/search/?brand=${encodeURIComponent(product.brand)}`} className="text-sm font-semibold text-brand">
              {product.brand}
            </Link>
            <h1 className="text-2xl leading-tight font-bold md:text-3xl">{product.name}</h1>
            {product.releaseYear && <span className="text-sm text-dim">{t.product.model(num(product.releaseYear))}</span>}
          </div>

          {best ? (
            <div className="flex flex-col gap-1 rounded-md bg-surface-2 p-4">
              <span className="text-sm text-dim">{t.product.bestNow}</span>
              <div className="flex flex-wrap items-baseline gap-3">
                <span className="text-3xl font-bold text-brand md:text-4xl">{formatTaka(best.price)}</span>
                {best.oldPrice && best.oldPrice > best.price && <span className="text-dim line-through">{formatTaka(best.oldPrice)}</span>}
              </div>
              <span className="flex flex-wrap items-center gap-2 text-sm">
                {t.product.bestAt(best.seller.name, ago(best.checkedAt))}
                <VerifiedBadge verified={best.seller.verified} />
              </span>
              {variant?.officialPrice && condition === "official" && <span className="text-sm text-dim">{t.product.officialPrice(product.brand, formatTaka(variant.officialPrice))}</span>}
            </div>
          ) : (
            <EmptyState icon={Store} title={t.product.noOffers} />
          )}

          {product.variants.length > 1 && (
            <div className="flex flex-col gap-2">
              <span className="text-sm font-semibold">{t.product.variant}</span>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v) => (
                  <Chip key={v.id} selected={v.id === variant?.id} onClick={() => setVariantId(v.id)}>
                    {v.label}
                  </Chip>
                ))}
              </div>
            </div>
          )}

          {conditions.length > 1 && (
            <div className="flex flex-col gap-2">
              <span className="text-sm font-semibold">{t.product.condition}</span>
              <div className="flex flex-wrap gap-2">
                {conditions.map((c) => (
                  <Chip key={c} selected={c === condition} onClick={() => setChosen(c)}>
                    {t.condition[c]}
                  </Chip>
                ))}
              </div>
            </div>
          )}

          {condition === "unofficial" && <p className="rounded-lg bg-gold-soft px-3 py-2 text-sm font-semibold text-gold-text">{t.product.unofficialWarning}</p>}

          {best && (
            <div className="hidden flex-wrap gap-3 md:flex">
              <BuyButton offer={best} />
              <a href="#stores" className="flex h-12 items-center rounded-lg border-2 border-brand px-6 font-bold text-brand hover:bg-brand-soft">
                {t.product.compare(num(shown.length))}
              </a>
            </div>
          )}
        </div>
      </div>

      {shown.length > 0 && (
        <section id="stores" className="flex scroll-mt-32 flex-col gap-3">
          <h2 className="text-lg font-bold md:text-xl">{t.product.byStore}</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {shown.map((offer, i) => (
              <OfferCard key={offer.id} offer={offer} best={i === 0} />
            ))}
          </div>
        </section>
      )}

      <section className="flex flex-col gap-3 rounded-lg bg-surface p-4 shadow-sm ring-1 ring-line-soft md:p-6">
        <h2 className="text-base font-bold">{t.product.history}</h2>
        <PriceChart history={history.filter((p) => shown.some((o) => o.id === p.offerId))} />
      </section>

      <SubmitPriceDialog
        product={`${fullName} ${variant?.label ?? ""}`.trim()}
        trigger={(open) => (
          <button type="button" onClick={open} className="flex h-12 items-center justify-center gap-2 rounded-md border border-dashed border-line bg-surface font-semibold text-dim hover:border-brand hover:text-brand">
            <Megaphone size={18} aria-hidden="true" />
            {t.product.reportCta}
          </button>
        )}
      />

      {best && (
        <div className="fixed inset-x-0 bottom-16 z-30 flex items-center gap-3 border-t border-line bg-surface px-4 py-2.5 md:hidden">
          <span className="flex flex-1 flex-col">
            <span className="text-lg leading-tight font-bold text-brand">{formatTaka(best.price)}</span>
            <span className="truncate text-xs text-dim">{best.seller.name}</span>
          </span>
          <BuyButton offer={best} className="h-11 px-5" />
        </div>
      )}
    </div>
  );
}
