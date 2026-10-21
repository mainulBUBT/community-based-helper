/* eslint-disable @next/next/no-img-element */
"use client";

import {
  BadgeCheck,
  ChevronRight,
  Megaphone,
  TrendingDown,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { SubmitPriceDialog } from "@/components/forms/SubmitPriceDialog";
import { CategoryIcon } from "@/components/product/CategoryIcon";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductIcon } from "@/components/product/ProductIcon";
import { SellerCard } from "@/components/seller/SellerCard";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { useAsync } from "@/hooks/useAsync";
import { useCategories } from "@/hooks/useCategories";
import { useI18n } from "@/hooks/useI18n";
import {
  getSiteSettings,
  listSellers,
  listSummaries,
} from "@/services/catalog";
import type { SiteSettings } from "@/types/admin";
import type { CategoryInfo, ProductSummary, Seller } from "@/types/catalog";
import { formatTaka } from "@/utils/format";

interface HomeData {
  summaries: ProductSummary[];
  sellers: Seller[];
  settings: SiteSettings;
}

async function loadHome(): Promise<HomeData> {
  const [summaries, sellers, settings] = await Promise.all([
    listSummaries(),
    listSellers(),
    getSiteSettings(),
  ]);
  return { summaries, sellers, settings };
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
    <div className="overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
      <div className="flex w-max gap-3 animate-marquee hover:[animation-play-state:paused] motion-reduce:animate-none">
        {loop.map((brand, i) => (
          <BrandTile key={`${brand}-${i}`} brand={brand} />
        ))}
      </div>
    </div>
  );
}

function DenseGrid({ items, deal }: { items: ProductSummary[]; deal?: boolean }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
      {items.map((summary) => (
        <ProductCard key={summary.product.id} summary={summary} deal={deal ? summary.drop : null} />
      ))}
    </div>
  );
}

function HighlightTile({
  href,
  icon: Icon,
  title,
  body,
}: {
  href: string;
  icon: LucideIcon;
  title: string;
  body: string;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-1 flex-col items-start gap-3 rounded-lg bg-surface p-4 shadow-sm ring-1 ring-line-soft transition-shadow hover:shadow-md sm:flex-row sm:items-center md:p-5"
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-gold-soft text-gold-text md:size-12">
        <Icon size={22} aria-hidden="true" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-[15px] leading-snug font-bold group-hover:text-brand">
          {title}
        </span>
        <span className="text-[13px] text-dim">{body}</span>
      </span>
      <ChevronRight
        size={18}
        className="hidden text-faint sm:block"
        aria-hidden="true"
      />
    </Link>
  );
}

function CategoryTiles({ summaries }: { summaries: ProductSummary[] }) {
  const { t, num, lang, prefix } = useI18n();
  const { top, family } = useCategories();
  const shown = top.filter((c) =>
    summaries.some((s) => family(c.slug).includes(s.product.category)),
  );
  return (
    <>
      <nav
        aria-label={t.home.categoryEyebrow}
        className="grid grid-cols-3 gap-2 rounded-lg bg-surface p-3 shadow-sm ring-1 ring-line-soft md:hidden"
      >
        {shown.map((c) => (
          <Link
            key={c.slug}
            href={`${prefix}/search/?category=${c.slug}`}
            className="flex flex-col items-center gap-1.5 rounded-md py-2 text-center active:bg-surface-2"
          >
            <span className="flex size-11 items-center justify-center rounded-full bg-brand-soft text-brand">
              <CategoryIcon name={c.icon} size={20} />
            </span>
            <span className="text-[13px] leading-tight font-semibold">
              {lang === "en" ? c.nameEn : c.name}
            </span>
          </Link>
        ))}
      </nav>
      <section className="hidden gap-3 md:grid md:grid-cols-3 xl:grid-cols-6">
        {shown.map((c) => (
          <Link
            key={c.slug}
            href={`${prefix}/search/?category=${c.slug}`}
            className="group flex min-w-0 items-center gap-3 rounded-lg bg-surface p-3 shadow-sm ring-1 ring-line-soft transition-shadow hover:shadow-md md:p-4"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand md:size-11">
              <CategoryIcon name={c.icon} size={20} />
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-bold group-hover:text-brand md:text-[15px]">
                {lang === "en" ? c.nameEn : c.name}
              </span>
              <span className="truncate text-xs text-dim">
                {t.home.models(
                  num(
                    summaries.filter((s) =>
                      family(c.slug).includes(s.product.category),
                    ).length,
                  ),
                )}
              </span>
            </span>
          </Link>
        ))}
      </section>
    </>
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
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold tracking-wider text-gold-text uppercase">
            {t.home.spotlightEyebrow} · {label(current)}
          </span>
          <h2 className="text-lg font-bold md:text-xl">{t.home.spotlight}</h2>
          <span className="text-sm text-dim">{t.home.spotlightSub}</span>
        </div>
        <Link
          href={`${prefix}/search/?category=${current.slug}`}
          className="text-sm font-semibold text-brand hover:underline"
        >
          {t.home.seeAllIn(num(items.length))} →
        </Link>
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

function DealsShelf({ deals }: { deals: ProductSummary[] }) {
  const { t, num, prefix } = useI18n();
  if (!deals.length) return null;

  return (
    <Shelf>
      <div className="flex flex-col gap-1">
        <span className="text-xs font-semibold tracking-wider text-gold-text uppercase">{t.home.dropsEyebrow}</span>
        <SectionHeader
          title={t.home.drops}
          subtitle={t.home.dropsSub}
          href={`${prefix}/search/?sort=drop`}
          linkLabel={t.home.seeAllIn(num(deals.length))}
        />
      </div>
      <DenseGrid items={deals.slice(0, 6)} deal />
    </Shelf>
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
            <DenseGrid items={items.slice(0, 6)} />
          </Shelf>
        );
      })}
    </>
  );
}

export function HomeView({ initial }: { initial: HomeData }) {
  const { lang, t, num, prefix } = useI18n();
  const { data } = useAsync(loadHome, [], initial);
  const { summaries, sellers, settings } = data ?? initial;

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

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <section className="relative flex flex-col justify-between gap-5 overflow-hidden rounded-lg bg-hero p-5 text-white md:gap-8 md:p-10">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -top-24 -right-24 size-72 rounded-full border-[40px] border-white/5"
          />
          <div className="relative flex flex-col gap-3">
            <h1 className="max-w-xl text-xl leading-snug font-bold md:text-[32px] md:leading-tight">
              {heroTitle}
            </h1>
            <p className="max-w-lg text-sm text-white/80 md:text-base">
              {(lang === "en" ? settings.taglineEn : settings.tagline) ||
                t.footer.tagline}
            </p>
          </div>
          <div className="relative flex flex-wrap gap-2">
            {settings.quickSearches.map((q, i) => (
              <Link
                key={q}
                href={`${prefix}/search/?q=${encodeURIComponent(q)}`}
                className={`${i > 2 ? "hidden md:inline-flex" : ""} rounded-full border border-white/25 px-3 py-1.5 text-[13px] font-semibold text-white hover:bg-white hover:text-brand md:px-4 md:py-2 md:text-sm`}
              >
                {q}
              </Link>
            ))}
          </div>
        </section>
        <div className="hidden gap-3 md:grid md:grid-cols-2 lg:grid-cols-1 lg:gap-4">
          <HighlightTile
            href={`${prefix}/search/?sort=drop`}
            icon={TrendingDown}
            title={t.home.drops}
            body={t.home.dropsCount(num(drops.length))}
          />
          <HighlightTile
            href={`${prefix}/sellers/`}
            icon={BadgeCheck}
            title={t.home.sellersSub}
            body={t.home.verifiedCount(
              num(sellers.filter((s) => s.verified).length),
            )}
          />
        </div>
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

        <section className="flex flex-col items-start justify-center gap-4 rounded-lg bg-gold-soft p-6 ring-1 ring-gold/20">
          <span className="flex size-12 items-center justify-center rounded-md bg-gold text-gold-ink">
            <Megaphone size={22} aria-hidden="true" />
          </span>
          <p className="text-lg font-bold">{t.home.reportTitle}</p>
          <SubmitPriceDialog
            trigger={(open) => (
              <button
                type="button"
                onClick={open}
                className="h-11 rounded-lg bg-brand px-5 font-bold text-brand-ink hover:bg-brand-hover"
              >
                {t.home.reportCta}
              </button>
            )}
          />
        </section>
      </div>
    </div>
  );
}
