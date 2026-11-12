"use client";

import { ChevronRight, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { SellerLogo } from "@/components/seller/SellerLogo";
import { Badge } from "@/components/ui/Badge";
import { useI18n } from "@/hooks/useI18n";
import type { ComparePick } from "@/services/catalog-core";
import { formatTaka } from "@/utils/format";
import { ProductIcon } from "./ProductIcon";

// প্রতিবার পাতা খুললে একবার; পাতার ভেতরে ঘোরাঘুরিতে কার্ড বদলায় না
const seed = typeof window === "undefined" ? 0 : Math.random();
const still = () => () => {};
// পাশের হিরোর সমান উচ্চতায় থাকতে সবচেয়ে সস্তা ৩টা দোকানই দেখাই, বাকিগুলো "সব দাম"-এ
const SHOWN_SHOPS = 3;

export function CompareCard({ picks }: { picks: ComparePick[] }) {
  const { t, num, lang, prefix } = useI18n();
  // build এর HTML এ প্রথমটা, ব্রাউজারে hydration এর পরে এলোমেলো একটা
  const roll = useSyncExternalStore(still, () => seed, () => 0);
  const [failed, setFailed] = useState(false);
  const pick = picks[Math.floor(roll * picks.length)];
  if (!pick) return null;
  const { product, compareAt } = pick.summary;
  const photo = !failed && product.images?.[0];
  // কার্ডে যেই ভার্সন দেখাই লিংকেও সেটাই পাঠাই — পণ্যের পাতা ওই ভার্সনেই খোলে
  const link = `${prefix}/product/${product.slug}/?v=${pick.variantId}`;
  const shops = pick.offers.slice(0, SHOWN_SHOPS);
  // "সবচেয়ে কম" শুধু স্টকে থাকা দোকানের মধ্যে; কোথাও স্টক না থাকলে তবেই সব দোকান থেকে (পণ্যের পাতার মতোই)
  const available = shops.filter((offer) => offer.inStock !== false);
  const pool = available.length ? available : shops;
  const lowestPrice = pool.length ? Math.min(...pool.map((offer) => offer.price)) : null;
  const highestPrice = shops.length ? Math.max(...shops.map((offer) => offer.price)) : 0;
  const gap = lowestPrice !== null ? highestPrice - lowestPrice : 0;
  const saving = compareAt && lowestPrice !== null ? compareAt - lowestPrice : 0;
  const offPercent = compareAt ? Math.round((saving / compareAt) * 100) : 0;
  const moreShops = pick.sellerTotal - shops.length;

  return (
    <aside className="relative flex min-w-0 flex-col overflow-hidden rounded-lg bg-surface shadow-sm ring-1 ring-line-soft">
      <div className="flex items-center justify-between gap-2 border-b border-line-soft bg-surface-2 px-4 py-2.5">
        <Badge tone="brand">
          <span className="size-1.5 rounded-full bg-ok" aria-hidden="true" />
          {t.home.compareEyebrow}
        </Badge>
        {saving > 0 && (
          <Badge tone="gold">
            {offPercent > 0 ? t.home.compareOff(num(offPercent)) : t.home.compareSaved(num(saving.toLocaleString(lang === "bn" ? "bn-BD" : "en-IN")))}
          </Badge>
        )}
      </div>

      <div className="flex items-center gap-3 px-4 py-3.5">
        <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-sm bg-white ring-1 ring-line-soft">
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photo}
              alt={`${product.brand} ${product.name}`}
              loading="lazy"
              referrerPolicy="no-referrer"
              onError={() => setFailed(true)}
              className="size-full object-contain p-1.5"
            />
          ) : (
            <ProductIcon product={product} size="fill" plain />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <span className="text-[9.5px] font-bold tracking-widest text-faint uppercase">
            {product.brand}
          </span>
          {/* পুরো কার্ডটাই এই লিংকে ক্লিকযোগ্য (দোকানের সারি আর বোতাম ওপরে থাকে) */}
          <Link
            href={link}
            className="mt-1 block line-clamp-2 text-[15px] leading-snug font-semibold text-ink after:absolute after:inset-0 hover:text-brand"
          >
            {product.name}
          </Link>
          {pick.variantLabel && (
            <span className="mt-0.5 block truncate text-[11px] text-dim">{pick.variantLabel}</span>
          )}
        </div>
        {lowestPrice !== null && (
          <span className="flex shrink-0 flex-col items-end gap-0.5 ps-1 text-right">
            <span className="text-lg leading-none font-bold tracking-tight text-ink tabular-nums">
              {formatTaka(lowestPrice, lang)}
            </span>
            {compareAt && saving > 0 && (
              <span className="text-[11px] text-faint line-through tabular-nums">{formatTaka(compareAt, lang)}</span>
            )}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-line-soft px-4 pt-2.5 pb-1.5">
        <span className="text-[10px] font-bold tracking-wider text-dim uppercase">
          {t.home.compareByShop}
        </span>
        {moreShops > 0 && (
          <span className="shrink-0 text-[11px] font-semibold text-faint">{t.home.compareMore(num(moreShops))}</span>
        )}
      </div>

      <ul className="flex flex-1 flex-col divide-y divide-line-soft px-2 pb-2">
        {shops.map((offer) => {
          const best = lowestPrice !== null && pool.includes(offer) && offer.price === lowestPrice;
          const delta = lowestPrice !== null ? offer.price - lowestPrice : 0;
          return (
            <li key={offer.id} className="flex flex-1">
              <Link
                href={link}
                className={`relative z-10 flex max-h-13 min-h-9 flex-1 items-center gap-2.5 rounded-xs px-2 transition-colors hover:bg-surface-2 ${best ? "bg-ok-soft/40" : ""}`}
              >
                <SellerLogo seller={offer.seller} size={22} />
                <span className="flex min-w-0 flex-1 items-center gap-1.5">
                  <span className="truncate text-[13px] font-semibold text-ink">
                    {offer.seller.name}
                  </span>
                  {best && (
                    <Badge tone="ok" size="sm">
                      {t.product.cheapest}
                    </Badge>
                  )}
                </span>
                {delta > 0 && (
                  <span className="flex w-[72px] shrink-0 items-center justify-end gap-0.5 text-[11px] font-medium whitespace-nowrap text-dim tabular-nums sm:w-20">
                    <TrendingUp size={12} strokeWidth={2.5} className="shrink-0 text-sale" aria-hidden="true" />
                    {`+${formatTaka(delta, lang)}`}
                  </span>
                )}
                <span className="w-20 shrink-0 text-right text-[13px] font-bold whitespace-nowrap text-ink tabular-nums sm:w-[88px]">
                  {formatTaka(offer.price, lang)}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="mt-auto flex items-center gap-3 border-t border-line-soft px-4 py-3 text-[11px] text-dim">
        <span className="min-w-0 truncate">
          {t.home.compareFound(num(pick.sellerTotal))}
          {gap > 0 && (
            <span className="ms-1.5 text-faint">{t.home.compareGap(formatTaka(gap, lang))}</span>
          )}
        </span>
        <Link
          href={link}
          className="relative z-10 ms-auto flex h-9 shrink-0 items-center gap-1 rounded-md bg-cta px-3 text-[13px] font-semibold text-cta-ink transition-colors hover:bg-cta-hover"
        >
          {t.home.compareSeeAll}
          <ChevronRight size={14} aria-hidden="true" />
        </Link>
      </div>
    </aside>
  );
}
