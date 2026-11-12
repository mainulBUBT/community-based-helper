"use client";

import { AlertTriangle, Banknote, CalendarClock, ChevronRight, CreditCard, ExternalLink, Gift, Package, Percent, Phone, Tag, Truck, Wallet, X, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { SellerLogo } from "@/components/seller/SellerLogo";
import { VerifiedBadge } from "@/components/seller/VerifiedBadge";
import { Badge } from "@/components/ui/Badge";
import { useI18n } from "@/hooks/useI18n";
import type { Condition, OfferView, PricePoint, Promo } from "@/types/catalog";
import { conditionLabel } from "@/utils/categories";
import { neverCharged, realOldPrice } from "@/utils/catalog";
import { formatTaka, telLink } from "@/utils/format";

const TONE: Partial<Record<Condition, "ok" | "gold" | "brand">> = { official: "ok", unofficial: "gold", replica_premium: "brand" };

// ধরনের নাম worker ইংরেজিতে আর অ্যাডমিন বাংলায় লেখে, তাই দুটোই ধরা
const KIND_ICONS: [RegExp, LucideIcon][] = [
  [/gift|উপহার/i, Gift],
  [/emi|কিস্তি/i, CalendarClock],
  [/card|কার্ড/i, CreditCard],
  [/bkash|nagad|cashback/i, Wallet],
  [/discount|coupon|কুপন/i, Percent],
  [/bundle/i, Package],
];
const kindIcon = (kind: string) => KIND_ICONS.find(([pattern]) => pattern.test(kind))?.[1] ?? Tag;

// মোবাইলে অফারের লেখা সারিতে কেটে যেত; বোতাম চাপলে নিচ থেকে পুরো তালিকা
function PromoSheet({ promos, offer, link }: { promos: Promo[]; offer: OfferView; link: string | null }) {
  const { t, num, lang } = useI18n();
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const { seller } = offer;

  useEffect(() => {
    if (open) dialog.current?.showModal();
    else dialog.current?.close();
  }, [open]);

  const until = (date: string) => t.product.promoUntil(new Date(date).toLocaleDateString(lang === "bn" ? "bn-BD" : "en-GB", { day: "numeric", month: "long" }));

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-7 w-fit items-center gap-1 rounded-full border border-gold-text/20 bg-gold-soft pr-2 pl-2.5 text-xs font-bold text-gold-text md:hidden"
      >
        <Tag size={13} aria-hidden="true" />
        {t.product.promoCount(num(promos.length))}
        <ChevronRight size={13} aria-hidden="true" />
      </button>
      <dialog
        ref={dialog}
        aria-label={t.product.promoTitle(seller.name)}
        onClose={() => setOpen(false)}
        onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        className="mx-0 mt-auto mb-0 max-h-[85dvh] w-full max-w-none rounded-t-2xl bg-surface p-0 text-ink shadow-2xl"
      >
        <div className="flex flex-col px-4 pt-2 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          <span className="mx-auto mb-3 h-1 w-10 rounded-full bg-line" aria-hidden="true" />
          <div className="flex items-center gap-2.5">
            <SellerLogo seller={seller} />
            <h2 className="flex-1 text-base font-bold">{t.product.promoTitle(seller.name)}</h2>
            <button type="button" aria-label={t.common.close} onClick={() => setOpen(false)} className="flex size-9 items-center justify-center rounded-full bg-surface-2 text-dim">
              <X size={17} aria-hidden="true" />
            </button>
          </div>
          <p className="mt-1 mb-3 text-[13px] text-dim">{t.product.promoSub}</p>
          <ul className="divide-y divide-line-soft border-t border-line-soft">
            {promos.map((promo) => {
              const Icon = kindIcon(promo.kind);
              const meta = [t.product.promoKinds[promo.kind], promo.endsOn && until(promo.endsOn)].filter(Boolean).join(" · ");
              return (
                <li key={promo.id} className="flex gap-3 py-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-gold-soft text-gold-text">
                    <Icon size={18} aria-hidden="true" />
                  </span>
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="text-sm leading-relaxed font-medium">{promo.text}</span>
                    {meta && <span className="text-xs text-faint">{meta}</span>}
                  </span>
                </li>
              );
            })}
          </ul>
          {link && (
            <a href={link} target="_blank" rel="noopener nofollow" className="mt-3 flex h-11 items-center justify-center gap-2 rounded-md bg-cta text-[15px] font-semibold text-cta-ink hover:bg-cta-hover">
              {t.product.promoGo(seller.name)}
              <ExternalLink size={16} aria-hidden="true" />
            </a>
          )}
        </div>
      </dialog>
    </>
  );
}

function InfoLine({ icon: Icon, parts }: { icon: LucideIcon; parts: string[] }) {
  if (!parts.length) return null;
  return (
    <span className="flex items-start gap-1.5 text-xs text-dim">
      <Icon size={14} className="mt-px shrink-0 text-faint" aria-hidden="true" />
      <span className="flex flex-wrap gap-x-3">
        {parts.map((part) => (
          <span key={part} className="whitespace-nowrap">
            {part}
          </span>
        ))}
      </span>
    </span>
  );
}

function OfferRow({ offer, official, best, warranty, showCondition, inflated, sharedLink, variantHint }: { offer: OfferView; official: number | null; best: boolean; warranty: boolean; showCondition: boolean; inflated: boolean; sharedLink: boolean; variantHint: string | null }) {
  const { t, ago, lang, prefix } = useI18n();
  const { seller } = offer;
  const link = offer.url ?? seller.website;
  const oldPrice = inflated ? null : realOldPrice(offer.oldPrice, official);
  const delivery = seller.delivery;
  const fee = (amount: number) => (amount ? `+${formatTaka(amount, lang)}` : t.product.deliveryFree);
  const deliveryParts = (
    delivery?.dhaka != null && delivery.dhaka === delivery.outside
      ? [t.product.deliveryEverywhere(fee(delivery.dhaka))]
      : [delivery?.dhaka != null && t.product.deliveryDhaka(fee(delivery.dhaka)), delivery?.outside != null && t.product.deliveryOutside(fee(delivery.outside))]
  ).filter((part): part is string => Boolean(part));

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
        <span className="flex items-center gap-1.5 text-xs text-dim">
          <span className="flex size-3.5 shrink-0 items-center justify-center" aria-hidden="true">
            <span className={`size-1.5 rounded-full ${stockDot}`} />
          </span>
          <span className="truncate">
            {stock}, {ago(offer.checkedAt)}
          </span>
        </span>
        <InfoLine icon={Truck} parts={deliveryParts} />
        {delivery?.cod && <InfoLine icon={Banknote} parts={[t.product.cod]} />}
        {sharedLink && variantHint && (
          <span className="flex items-start gap-1.5 text-xs font-medium text-gold-text">
            <AlertTriangle size={13} className="mt-0.5 shrink-0" aria-hidden="true" />
            {t.product.checkVariant(variantHint)}
          </span>
        )}
        {!link && seller.phone && <span className="text-[13px] font-semibold text-ink">{seller.phone}</span>}
        {offer.promos.length > 0 && <PromoSheet promos={offer.promos} offer={offer} link={link} />}
        {offer.promos.map((promo) => (
          <span key={promo.id} className="hidden items-start gap-1 text-[13px] font-medium text-gold-text md:flex">
            <Tag size={13} className="mt-0.5 shrink-0" aria-hidden="true" />
            <span className="line-clamp-1">{promo.text}</span>
          </span>
        ))}
      </div>

      <span className="col-start-2 row-start-1 flex flex-col items-end md:row-span-2 md:self-center">
        {best && <span className="text-[11px] font-semibold text-ok">{t.product.cheapest}</span>}
        <span className="text-[17px] leading-tight font-bold tracking-tight text-ink md:text-lg">{formatTaka(offer.price, lang)}</span>
        {oldPrice && oldPrice > offer.price && <span className="text-xs text-faint line-through">{formatTaka(oldPrice, lang)}</span>}
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

interface OffersTableProps {
  offers: OfferView[];
  official: number | null;
  warranty: boolean;
  showCondition: boolean;
  history: PricePoint[];
  // এই লিংকগুলো একই পণ্যের একাধিক ভার্সনে ব্যবহৃত — শপ পাতা ভুল ভার্সনে খুলতে পারে
  sharedLinks: Set<string>;
  // শপে যে ভার্সন বাছতে হবে (বেস ভার্সনে null — ওই লিংক ঠিক খোলে)
  variantHint: string | null;
}

export function OffersTable({ offers, official, warranty, showCondition, history, sharedLinks, variantHint }: OffersTableProps) {
  // "সবচেয়ে কম" শুধু স্টকে থাকা দোকানের মধ্যে
  const available = offers.filter((offer) => offer.inStock !== false);
  const lowest = available.length ? Math.min(...available.map((offer) => offer.price)) : null;
  return (
    <ul className="divide-y divide-line-soft">
      {offers.map((offer) => (
        <OfferRow
          key={offer.id}
          offer={offer}
          official={official}
          best={available.includes(offer) && offer.price === lowest}
          warranty={warranty}
          showCondition={showCondition}
          inflated={neverCharged(offer, history)}
          sharedLink={sharedLinks.has(offer.url ?? offer.seller.website ?? "")}
          variantHint={variantHint}
        />
      ))}
    </ul>
  );
}
