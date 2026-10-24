/* eslint-disable @next/next/no-img-element */
"use client";

import {
  ArrowRight,
  Megaphone,
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useRef, useMemo, type ReactNode } from "react";
import { SubmitPriceDialog } from "@/components/forms/SubmitPriceDialog";
import { AllCategoriesIcon, CategoryIcon } from "@/components/product/CategoryIcon";
import { CompareCard } from "@/components/product/CompareCard";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductIcon } from "@/components/product/ProductIcon";
import { SellerCard } from "@/components/seller/SellerCard";
import { BrandIcon } from "@/components/ui/BrandIcon";
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

function BrandTile({ brand }: { brand: string }) {
  const { prefix } = useI18n();
  return (
    <Link
      href={`${prefix}/search/?brand=${encodeURIComponent(brand)}`}
      className="group flex h-14 w-40 shrink-0 items-center justify-center gap-2.5 rounded-md border border-line bg-surface text-[15px] font-bold tracking-tight text-dim transition-colors hover:border-brand hover:text-brand"
    >
      <BrandIcon brand={brand} size={24} className="size-6" />
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

function mixProducts(items: ProductSummary[]): ProductSummary[] {
  const groups = new Map<string, ProductSummary[]>();
  for (const it of items) {
    const key = it.product.category;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(it);
  }
  const buckets = [...groups.values()];
  const out: ProductSummary[] = [];
  let remaining = items.length;
  while (remaining > 0) {
    for (const b of buckets) {
      if (b.length) {
        out.push(b.shift()!);
        remaining--;
      }
    }
  }
  return out;
}

function DealsShelf({
  deals,
  interval,
}: {
  deals: ProductSummary[];
  interval: number;
}) {
  const { t, num, prefix } = useI18n();
  const items = useMemo(() => mixProducts(deals).slice(0, 25), [deals]);
  const trackRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(0);
  const [index, setIndex] = useState(0);
  const [transition, setTransition] = useState(true);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const measure = () => {
      if (track.children.length < 2) return;
      const first = track.children[0] as HTMLElement;
      const second = track.children[1] as HTMLElement;
      const newStep = second.offsetLeft - first.offsetLeft;
      if (newStep > 0) setStep(newStep);
    };
    measure();
    // Re-measure when images load (lazy/eager) and on resize
    const ro = new ResizeObserver(measure);
    ro.observe(track);
    const imgs = track.querySelectorAll("img");
    const onLoad = () => measure();
    imgs.forEach((img) => img.addEventListener("load", onLoad));
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      imgs.forEach((img) => img.removeEventListener("load", onLoad));
      window.removeEventListener("resize", measure);
    };
  }, [items]);

  useEffect(() => {
    if (!items.length || paused) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1 >= items.length ? i : i + 1));
    }, Math.max(1000, interval * 1000));
    return () => clearInterval(id);
  }, [items, paused, interval]);

  // When the last real item is at the left edge, jump back to 0 (no transition)
  useEffect(() => {
    if (index < items.length - 1) return;
    const id = setTimeout(() => {
      setTransition(false);
      setIndex(0);
      requestAnimationFrame(() => setTransition(true));
    }, 500);
    return () => clearTimeout(id);
  }, [index, items.length]);

  // Duplicate enough items so the viewport never runs out of cards while the
  // last real item slides into view (max 5 visible at lg).
  const looped = useMemo(() => {
    if (!items.length) return [];
    const out = [...items];
    while (out.length < items.length + 4) out.push(...items);
    return out;
  }, [items]);

  if (!items.length) return null;

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
      <div
        className="overflow-hidden"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div
          ref={trackRef}
          className="flex gap-3"
          style={{
            transform: `translateX(-${index * step}px)`,
            transition: transition ? "transform 500ms ease" : "none",
          }}
        >
          {looped.map((summary, i) => (
            <div
              key={`${summary.product.id}-${i}`}
              className="w-1/2 shrink-0 sm:w-1/3 lg:w-1/5"
            >
              <ProductCard key={summary.product.id} summary={summary} deal={summary.drop} loading="eager" />
            </div>
          ))}
        </div>
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
                    {formatTaka(lowest, lang)}
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
  // Fill the carousel: drops first, then popular non-drop products
  const nonDrops = summaries
    .filter((s) => !s.drop)
    .sort(byPopularity);
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
              <span className="size-1.5 rounded-full bg-[#5fe3c9] shadow-[0_0_0_3px_rgb(95_227_201/0.18)]" aria-hidden="true" />
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
