/* eslint-disable @next/next/no-img-element */
"use client";

import {
  ArrowRight,
  Megaphone,
} from "lucide-react";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { SubmitPriceDialog } from "@/components/forms/SubmitPriceDialog";
import { AllCategoriesIcon, CategoryIcon } from "@/components/product/CategoryIcon";
import { CompareCard } from "@/components/product/CompareCard";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductIcon } from "@/components/product/ProductIcon";
import { SellerCard } from "@/components/seller/SellerCard";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { useAsync } from "@/hooks/useAsync";
import { useCategories } from "@/hooks/useCategories";
import { useI18n } from "@/hooks/useI18n";
import {
  getSiteSettings,
  listComparisons,
  listSellers,
  listSummaries,
} from "@/services/catalog";
import type { ComparePick } from "@/services/catalog-core";
import type { SiteSettings } from "@/types/admin";
import type { CategoryInfo, ProductSummary, Seller } from "@/types/catalog";
import { formatTaka } from "@/utils/format";

interface HomeData {
  summaries: ProductSummary[];
  sellers: Seller[];
  settings: SiteSettings;
  comparison: ComparePick | null;
}

async function loadHome(): Promise<HomeData> {
  const [summaries, sellers, settings, comparison] = await Promise.all([
    listSummaries(),
    listSellers(),
    getSiteSettings(),
    listComparisons(),
  ]);
  return { summaries, sellers, settings, comparison };
}

const byPopularity = (a: ProductSummary, b: ProductSummary) =>
  b.product.popularity - a.product.popularity;

function Shelf({ children }: { children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4 rounded-lg bg-surface p-4 shadow-sm ring-1 ring-line-soft md:p-6">
      {children}
    </section>
  );
}

const BRAND_DOMAIN: Record<string, string> = {
  Samsung: "samsung.com",
  Xiaomi: "xiaomi.com",
  Apple: "apple.com",
};

const brandDomain = (brand: string) =>
  BRAND_DOMAIN[brand] ?? `${brand.toLowerCase().replace(/[^a-z0-9]/g, "")}.com`;

function BrandTile({ brand }: { brand: string }) {
  const [failed, setFailed] = useState(false);
  const { prefix } = useI18n();
  return (
    <Link
      href={`${prefix}/search/?brand=${encodeURIComponent(brand)}`}
      className="group flex h-14 w-40 shrink-0 items-center justify-center gap-2.5 rounded-md border border-line bg-surface text-[15px] font-bold tracking-tight text-dim transition-colors hover:border-brand hover:text-brand"
    >
      {failed ? (
        <span className="flex size-6 items-center justify-center rounded-sm bg-brand-soft text-xs font-bold text-brand">
          {brand.slice(0, 1)}
        </span>
      ) : (
        <img
          src={`https://www.google.com/s2/favicons?domain=${brandDomain(brand)}&sz=64`}
          alt=""
          width={24}
          height={24}
          onError={() => setFailed(true)}
          className="size-6 object-contain"
        />
      )}
      {brand}
    </Link>
  );
}

function BrandMarquee({ brands }: { brands: string[] }) {
  const loop = [...brands, ...brands, ...brands, ...brands];
  return (
    <div className="brand-marquee-space overflow-hidden">
      <div className="brand-marquee flex w-max gap-3">
        {loop.map((brand, i) => (
          <BrandTile key={`${brand}-${i}`} brand={brand} />
        ))}
      </div>
    </div>
  );
}

function SectionEyebrow({ children }: { children: ReactNode }) {
  return (
    <span className="flex items-center gap-2 text-[10.5px] font-bold tracking-[1.3px] text-accent uppercase">
      <span className="h-0.5 w-3.5 rounded-full bg-accent" aria-hidden="true" />
      {children}
    </span>
  );
}

function CategoryTiles({ summaries }: { summaries: ProductSummary[] }) {
  const { t, num, lang, prefix } = useI18n();
  const { top, family } = useCategories();
  const shown = top
    .filter((c) =>
      summaries.some((s) => family(c.slug).includes(s.product.category)),
    )
    .map((c) => ({
      c,
      count: summaries.filter((s) =>
        family(c.slug).includes(s.product.category),
      ).length,
    }));
  return (
    <nav
      aria-label={t.home.categoryEyebrow}
      className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4"
    >
      {shown.map(({ c, count }) => (
        <Link
          key={c.slug}
          href={`${prefix}/search/?category=${c.slug}`}
          className="flex w-24 shrink-0 flex-col items-center gap-1.5 rounded-lg bg-surface px-2 py-3 text-center shadow-sm ring-1 ring-line-soft"
        >
          <span className="flex size-11 items-center justify-center rounded-full bg-brand-soft text-brand">
            <CategoryIcon name={c.icon} size={20} />
          </span>
          <span className="text-[13px] leading-tight font-semibold">
            {lang === "en" ? c.nameEn : c.name}
          </span>
          <span className="text-[11px] font-bold text-dim">
            {t.home.models(num(count))}
          </span>
        </Link>
      ))}
      <Link
        href={`${prefix}/search/`}
        className="flex w-24 shrink-0 flex-col items-center justify-center gap-1.5 rounded-lg bg-surface px-2 py-3 text-center shadow-sm ring-1 ring-line-soft"
      >
        <span className="flex size-11 items-center justify-center rounded-full bg-surface-2 text-dim">
          <AllCategoriesIcon size={20} />
        </span>
        <span className="text-[13px] leading-tight font-semibold">
          {t.home.allCategories}
        </span>
        <span className="text-[11px] font-bold text-dim">
          {t.home.models(num(summaries.length))}
        </span>
      </Link>
    </nav>
  );
}

function DealsShelf({ deals }: { deals: ProductSummary[] }) {
  const { t, num, prefix } = useI18n();
  if (!deals.length) return null;

  return (
    <Shelf>
      <div className="flex flex-col gap-3">
        <SectionEyebrow>{t.home.dropsEyebrow}</SectionEyebrow>
        <SectionHeader
          title={t.home.drops}
          subtitle={t.home.dropsSub}
          href={`${prefix}/search/?sort=drop`}
          linkLabel={t.home.seeAllIn(num(deals.length))}
        />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {deals.slice(0, 5).map((summary) => (
          <ProductCard key={summary.product.id} summary={summary} deal={summary.drop} />
        ))}
      </div>
    </Shelf>
  );
}

function SpotlightShelf({ summaries }: { summaries: ProductSummary[] }) {
  const { t, num, lang, prefix } = useI18n();
  const { top, family } = useCategories();
  const withProducts = top.filter((c) =>
    summaries.some((s) => family(c.slug).includes(s.product.category)),
  );
  const [active, setActive] = useState(withProducts[0]?.slug ?? "");
  const current =
    withProducts.find((c) => c.slug === active) ?? withProducts[0];
  if (!current) return null;
  const items = summaries.filter((s) =>
    family(current.slug).includes(s.product.category),
  );
  const ranked = [...items]
    .sort(
      (a, b) =>
        b.product.popularity +
        b.sellerCount * 5 -
        (a.product.popularity + a.sellerCount * 5),
    )
    .slice(0, 5);
  const label = (c: CategoryInfo) => (lang === "en" ? c.nameEn : c.name);

  return (
    <section className="flex flex-col gap-5 rounded-lg bg-surface p-4 shadow-sm ring-1 ring-line-soft md:p-6">
      <div className="flex flex-col gap-3">
        <SectionEyebrow>
          {t.home.spotlightEyebrow} · {label(current)}
        </SectionEyebrow>
        <SectionHeader
          title={t.home.spotlight}
          subtitle={t.home.spotlightSub}
          href={`${prefix}/search/?category=${current.slug}`}
          linkLabel={t.home.seeAllIn(num(items.length))}
        />
      </div>
      <div className="grid grid-cols-3 gap-2 md:flex md:flex-wrap">
        {withProducts.map((c) => (
          <button
            key={c.slug}
            type="button"
            aria-pressed={c.slug === current.slug}
            onClick={() => setActive(c.slug)}
            className={`flex h-9 min-w-0 items-center justify-center gap-1.5 rounded-full border px-2 text-[13px] font-semibold transition-colors md:gap-2 md:px-4 md:text-sm ${c.slug === current.slug ? "border-brand bg-brand text-brand-ink" : "border-line bg-surface hover:border-brand"}`}
          >
            <CategoryIcon name={c.icon} size={15} />
            {label(c)}
          </button>
        ))}
      </div>
      <ol className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {ranked.map(({ product, lowest, sellerCount }, i) => (
          <li key={product.id}>
            <Link
              href={`${prefix}/product/${product.slug}/`}
              className="group flex h-full flex-col gap-3 rounded-lg border border-line-soft p-3 transition-colors hover:border-brand"
            >
              <div className="flex items-start justify-between">
                <span
                  className={`text-xl leading-none font-bold ${i === 0 ? "text-gold" : "text-faint"}`}
                >
                  #{num(i + 1)}
                </span>
                <span className="rounded bg-surface-2 px-1.5 py-0.5 text-[11px] font-semibold text-dim">
                  {t.home.shopsAt(num(sellerCount))}
                </span>
              </div>
              <div className="flex aspect-square items-center justify-center">
                <ProductIcon product={product} size="fill" plain />
              </div>
              <div className="flex flex-1 flex-col gap-1">
                <span className="text-[11px] font-semibold tracking-wider text-dim uppercase">
                  {product.brand}
                </span>
                <span className="line-clamp-2 text-sm font-semibold group-hover:text-brand">
                  {product.name}
                </span>
              </div>
              {lowest && (
                <span className="flex flex-col">
                  <span className="text-[11px] text-dim">
                    {t.home.bestPrice}
                  </span>
                  <span className="text-base font-bold tracking-tight">
                    {formatTaka(lowest)}
                  </span>
                </span>
              )}
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}

function CategoryRows({ summaries }: { summaries: ProductSummary[] }) {
  const { t, num, lang, prefix } = useI18n();
  const { top, family } = useCategories();
  return (
    <>
      {top.map((c) => {
        const items = summaries
          .filter((s) => family(c.slug).includes(s.product.category))
          .sort(byPopularity);
        if (!items.length) return null;
        return (
          <Shelf key={c.slug}>
            <SectionHeader
              title={lang === "en" ? c.nameEn : c.name}
              href={`${prefix}/search/?category=${c.slug}`}
              linkLabel={t.home.seeAllIn(num(items.length))}
            />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {items.slice(0, 6).map((summary) => (
                <ProductCard key={summary.product.id} summary={summary} />
              ))}
            </div>
          </Shelf>
        );
      })}
    </>
  );
}

export function HomeView({ initial }: { initial: HomeData }) {
  const { lang, t, prefix } = useI18n();
  const { data } = useAsync(loadHome, [], initial);
  const { summaries, sellers, settings, comparison } = data ?? initial;

  const drops = summaries
    .filter((s) => s.drop)
    .sort((a, b) => (b.drop ?? 0) - (a.drop ?? 0));
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

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
        <section className="relative flex flex-col justify-between gap-6 overflow-hidden rounded-xl bg-hero p-6 text-white shadow-hero md:p-10">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -top-24 -right-24 size-72 rounded-full border-[40px] border-white/5"
          />
          <div className="relative flex flex-col gap-4">
            <span className="inline-flex w-fit items-center gap-2 text-[12.5px] font-medium text-white/70">
              <span className="size-1.5 rounded-full bg-[#5fe3c9] shadow-[0_0_0_3px_rgb(95_227_201/0.18)]" aria-hidden="true" />
              {t.home.heroEyebrow}
            </span>
            <h1 className="max-w-xl text-2xl leading-[1.18] font-bold tracking-tight md:text-[40px] md:leading-[1.16]">
              {heroTitle}
            </h1>
            <p className="max-w-[46ch] text-sm leading-relaxed text-white/75 md:text-[15.5px]">
              {heroSub}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2.5">
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

      <DealsShelf deals={drops} />

      <SpotlightShelf summaries={summaries} />

      <CategoryRows summaries={summaries} />

      <Shelf>
        <SectionHeader title={t.home.brands} />
        <BrandMarquee brands={brands} />
      </Shelf>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
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
