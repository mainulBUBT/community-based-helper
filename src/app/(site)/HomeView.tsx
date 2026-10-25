"use client";

import { ArrowRight, Megaphone } from "lucide-react";
import Link from "next/link";
import { SubmitPriceDialog } from "@/components/forms/SubmitPriceDialog";
import { BrandMarquee } from "@/components/home/BrandMarquee";
import { CategoryRows } from "@/components/home/CategoryRows";
import { CategoryTiles } from "@/components/home/CategoryTiles";
import { DealsShelf } from "@/components/home/DealsShelf";
import { Shelf } from "@/components/home/Shelf";
import { SpotlightShelf } from "@/components/home/SpotlightShelf";
import { CompareCard } from "@/components/product/CompareCard";
import { SellerCard } from "@/components/seller/SellerCard";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { useI18n } from "@/hooks/useI18n";
import type { HomeData } from "@/services/catalog-core";
import { byPopularity, byStock } from "@/utils/catalog";

export function HomeView({ initial }: { initial: HomeData }) {
  const { lang, t, prefix } = useI18n();
  const { summaries, sellers, settings, comparison } = initial;

  const drops = summaries
    .filter((s) => s.drop)
    .sort((a, b) => byStock(a, b) || (b.drop ?? 0) - (a.drop ?? 0));
  // Fill the carousel: drops first, then popular non-drop products
  const nonDrops = summaries
    .filter((s) => !s.drop)
    .sort((a, b) => byStock(a, b) || byPopularity(a, b));
  const carouselItems = [...drops, ...nonDrops].slice(0, 25);
  const brands = [...new Set(summaries.map((s) => s.product.brand))];
  const trusted = [...sellers]
    .sort((a, b) => Number(b.verified) - Number(a.verified))
    .slice(0, 5);
  const heroTitle =
    (lang === "en" ? settings.heroTitleEn : settings.heroTitle) ||
    t.home.heroTitle;
  const heroSub =
    (lang === "en" ? settings.taglineEn : settings.tagline) ||
    t.home.heroSub;
  const heroEyebrow =
    (lang === "en" ? settings.heroEyebrowEn : settings.heroEyebrow) ||
    t.home.heroEyebrow;

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
        <section className="relative flex flex-col justify-between gap-5 overflow-hidden rounded-xl bg-hero p-5 text-white shadow-hero md:p-8">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -top-24 -right-24 size-72 rounded-full border-[40px] border-white/5"
          />
          <div className="relative flex flex-col gap-3.5">
            <span className="inline-flex w-fit items-center gap-2 text-[12.5px] font-medium text-white/70">
              <span className="size-1.5 rounded-full bg-live shadow-[0_0_0_3px_color-mix(in_srgb,var(--color-live)_18%,transparent)]" aria-hidden="true" />
              {heroEyebrow}
            </span>
            <h1 className="max-w-xl text-2xl leading-[1.18] font-bold tracking-tight md:text-[40px] md:leading-[1.16]">
              {heroTitle}
            </h1>
            <p className="max-w-[46ch] text-sm leading-relaxed text-white/75 md:text-[15.5px]">
              {heroSub}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-2.5">
              <Link
                href={`${prefix}/search/`}
                className="inline-flex h-11 shrink-0 items-center gap-2 rounded-md bg-white px-4 text-[13.5px] font-bold text-brand shadow-[0_10px_24px_-14px_rgb(0_0_0/0.55)] transition-transform hover:-translate-y-px md:h-[46px] md:px-5 md:text-[14.5px]"
              >
                {t.home.heroPrimary}
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
              <Link
                href={`${prefix}/search/?sort=drop`}
                className="inline-flex h-11 shrink-0 items-center rounded-md border border-white/25 px-4 text-[13.5px] font-semibold text-white transition-colors hover:bg-white/10 md:h-[46px] md:px-5 md:text-[14.5px]"
              >
                {t.home.heroSecondary}
              </Link>
            </div>
          </div>
          <div className="relative flex flex-wrap gap-2">
            {settings.quickSearches.map((q, i) => (
              <Link
                key={q}
                href={`${prefix}/search/?q=${encodeURIComponent(q)}`}
                className={`${i > 2 ? "hidden md:inline-flex" : ""} inline-flex h-8 items-center rounded-xs border border-white/15 bg-white/5 px-3 text-[12.5px] font-semibold text-white/80 transition-colors hover:border-white/30 hover:bg-white/10 hover:text-white md:h-[34px] md:px-3.5`}
              >
                {q}
              </Link>
            ))}
          </div>
        </section>
        <CompareCard pick={comparison} />
      </div>

      <CategoryTiles summaries={summaries} />

      {(settings.showDrops ?? true) && (
        <DealsShelf deals={carouselItems} interval={settings.dropsInterval ?? 4} />
      )}

      {(settings.showSpotlight ?? true) && <SpotlightShelf summaries={summaries} />}

      {(settings.showCategoryRows ?? true) && <CategoryRows summaries={summaries} />}

      {(settings.showBrands ?? true) && (
        <Shelf>
          <SectionHeader title={t.home.brands} />
          <BrandMarquee brands={brands} />
        </Shelf>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        {(settings.showSellers ?? true) && (
          <Shelf>
            <SectionHeader
              title={t.home.sellers}
              subtitle={t.home.sellersSub}
              href={`${prefix}/sellers/`}
              linkLabel={t.common.seeAll}
            />
            <div className="-mx-4 divide-y divide-line-soft md:-mx-6">
              {trusted.map((seller) => (
                <SellerCard key={seller.id} seller={seller} />
              ))}
            </div>
          </Shelf>
        )}

        <section className="relative flex flex-col items-start justify-center gap-4 overflow-hidden rounded-lg bg-gold-soft p-6 ring-1 ring-gold/25 md:p-8">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -top-16 -right-16 size-48 rounded-full border-[30px] border-gold/10"
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-20 -left-12 size-44 rounded-full bg-gold/10"
          />
          <span className="relative flex size-12 items-center justify-center rounded-lg bg-gradient-to-br from-gold to-gold/75 text-gold-ink shadow-[0_12px_28px_-14px_rgb(217_119_6/0.75)]">
            <Megaphone size={22} aria-hidden="true" />
          </span>
          <div className="relative flex flex-col gap-1.5">
            <p className="text-xl leading-snug font-bold tracking-tight">{t.home.reportTitle}</p>
            <p className="text-sm leading-relaxed text-dim">{t.home.reportSub}</p>
          </div>
          <SubmitPriceDialog
            trigger={(open) => (
              <button
                type="button"
                onClick={open}
                className="group relative inline-flex h-11 items-center gap-2 rounded-lg bg-brand px-5 font-bold text-brand-ink shadow-[0_12px_28px_-14px_rgb(15_118_110/0.7)] transition-colors hover:bg-brand-hover"
              >
                {t.home.reportCta}
                <ArrowRight
                  size={16}
                  aria-hidden="true"
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </button>
            )}
          />
        </section>
      </div>
    </div>
  );
}
