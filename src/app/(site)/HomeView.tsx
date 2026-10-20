/* eslint-disable @next/next/no-img-element */
"use client";

import { BadgeCheck, ChevronRight, Laptop, Megaphone, Smartphone, TrendingDown, Watch } from "lucide-react";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { SubmitPriceDialog } from "@/components/forms/SubmitPriceDialog";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductRow } from "@/components/product/ProductRow";
import { SellerCard } from "@/components/seller/SellerCard";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { useAsync } from "@/hooks/useAsync";
import { useI18n } from "@/hooks/useI18n";
import { getSiteSettings, listSellers, listSummaries } from "@/services/catalog";
import type { SiteSettings } from "@/types/admin";
import type { Category, ProductSummary, Seller } from "@/types/catalog";

const CATEGORIES: { id: Category; icon: typeof Smartphone }[] = [
  { id: "mobile", icon: Smartphone },
  { id: "apple", icon: Laptop },
  { id: "watch", icon: Watch },
];

interface HomeData {
  summaries: ProductSummary[];
  sellers: Seller[];
  settings: SiteSettings;
}

async function loadHome(): Promise<HomeData> {
  const [summaries, sellers, settings] = await Promise.all([listSummaries(), listSellers(), getSiteSettings()]);
  return { summaries, sellers, settings };
}

const byPopularity = (a: ProductSummary, b: ProductSummary) => b.product.popularity - a.product.popularity;

function Shelf({ children }: { children: ReactNode }) {
  return <section className="flex flex-col gap-4 rounded-lg bg-surface p-4 shadow-sm ring-1 ring-line-soft md:p-6">{children}</section>;
}

const BRAND_DOMAIN: Record<string, string> = { Samsung: "samsung.com", Xiaomi: "xiaomi.com", Apple: "apple.com" };

const brandDomain = (brand: string) => BRAND_DOMAIN[brand] ?? `${brand.toLowerCase().replace(/[^a-z0-9]/g, "")}.com`;

function BrandTile({ brand }: { brand: string }) {
  const [failed, setFailed] = useState(false);
  const { prefix } = useI18n();
  return (
    <Link
      href={`${prefix}/search/?brand=${encodeURIComponent(brand)}`}
      className="group flex h-14 w-40 shrink-0 items-center justify-center gap-2.5 rounded-md border border-line bg-surface text-[15px] font-bold tracking-tight text-dim transition-colors hover:border-brand hover:text-brand"
    >
      {failed ? (
        <span className="flex size-6 items-center justify-center rounded-sm bg-brand-soft text-xs font-bold text-brand">{brand.slice(0, 1)}</span>
      ) : (
        <img src={`https://www.google.com/s2/favicons?domain=${brandDomain(brand)}&sz=64`} alt="" width={24} height={24} onError={() => setFailed(true)} className="size-6 object-contain" />
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

// কলাম সংখ্যা এমন বাছি যাতে সারি নিঃশেষে ভাঙে — ৮টা হলে ৪ কলাম, ১৫টা হলে ৫ কলাম
const GRID_BY_COUNT: Record<number, string> = {
  1: "sm:grid-cols-1",
  2: "sm:grid-cols-2",
  5: "sm:grid-cols-3 lg:grid-cols-5",
};

function catalogCols(count: number): string {
  if (GRID_BY_COUNT[count]) return GRID_BY_COUNT[count];
  if (count % 5 === 0) return GRID_BY_COUNT[5];
  if (count % 4 === 0) return "sm:grid-cols-2 lg:grid-cols-4";
  if (count % 3 === 0) return "sm:grid-cols-3";
  return GRID_BY_COUNT[5];
}

function CardGrid({ items }: { items: ProductSummary[] }) {
  return (
    <div className={`no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 sm:mx-0 sm:grid sm:overflow-visible sm:px-0 ${catalogCols(items.length)}`}>
      {items.map((summary) => (
        <div key={summary.product.id} className="w-44 shrink-0 sm:w-auto">
          <ProductCard summary={summary} />
        </div>
      ))}
    </div>
  );
}

function HighlightTile({ href, icon: Icon, title, body }: { href: string; icon: typeof Smartphone; title: string; body: string }) {
  return (
    <Link href={href} className="group flex flex-1 flex-col items-start gap-3 rounded-lg bg-surface p-4 shadow-sm ring-1 ring-line-soft transition-shadow hover:shadow-md sm:flex-row sm:items-center md:p-5">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-gold-soft text-gold-text md:size-12">
        <Icon size={22} aria-hidden="true" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-[15px] leading-snug font-bold group-hover:text-brand">{title}</span>
        <span className="text-[13px] text-dim">{body}</span>
      </span>
      <ChevronRight size={18} className="hidden text-faint sm:block" aria-hidden="true" />
    </Link>
  );
}

function CategoryTiles() {
  const { t, prefix } = useI18n();
  return (
    <section className="grid grid-cols-3 gap-3">
      {CATEGORIES.map(({ id, icon: Icon }) => (
        <Link key={id} href={`${prefix}/search/?category=${id}`} className="group flex flex-col items-center gap-2 rounded-lg bg-surface p-4 text-center shadow-sm ring-1 ring-line-soft transition-shadow hover:shadow-md md:flex-row md:gap-4 md:p-5 md:text-left">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand md:size-14">
            <Icon size={24} aria-hidden="true" />
          </span>
          <span className="flex flex-col">
            <span className="font-bold group-hover:text-brand">{t.category[id].label}</span>
            <span className="hidden text-sm text-dim md:block">{t.category[id].hint}</span>
          </span>
        </Link>
      ))}
    </section>
  );
}

export function HomeView({ initial }: { initial: HomeData }) {
  const { lang, t, num, prefix } = useI18n();
  const { data } = useAsync(loadHome, [], initial);
  const { summaries, sellers, settings } = data ?? initial;

  const drops = summaries.filter((s) => s.drop).sort((a, b) => (b.drop ?? 0) - (a.drop ?? 0)).slice(0, 5);
  const allProducts = [...summaries].sort(byPopularity).slice(0, 15);
  const popular = [...summaries].sort(byPopularity).slice(0, 6);
  const brands = [...new Set(summaries.map((s) => s.product.brand))];
  const trusted = [...sellers].sort((a, b) => Number(b.verified) - Number(a.verified)).slice(0, 5);
  const heroTitle = (lang === "en" ? settings.heroTitleEn : settings.heroTitle) || t.home.heroTitle;

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <section className="relative flex flex-col justify-between gap-8 overflow-hidden rounded-lg bg-hero p-6 text-white md:p-10">
          <span aria-hidden="true" className="pointer-events-none absolute -top-24 -right-24 size-72 rounded-full border-[40px] border-white/5" />
          <div className="relative flex flex-col gap-3">
            <h1 className="max-w-xl text-2xl leading-snug font-bold md:text-[40px] md:leading-tight">{heroTitle}</h1>
            {lang === "bn" && settings.tagline && <p className="max-w-lg text-white/80">{settings.tagline}</p>}
          </div>
          <div className="relative flex flex-wrap gap-2">
            {settings.quickSearches.map((q) => (
              <Link key={q} href={`${prefix}/search/?q=${encodeURIComponent(q)}`} className="rounded-full border border-white/25 px-4 py-2 text-sm font-semibold text-white hover:bg-white hover:text-brand">
                {q}
              </Link>
            ))}
          </div>
        </section>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-1 lg:gap-4">
          <HighlightTile href={`${prefix}/search/?sort=drop`} icon={TrendingDown} title={t.home.drops} body={t.search.count(num(drops.length))} />
          <HighlightTile href={`${prefix}/sellers/`} icon={BadgeCheck} title={t.home.sellersSub} body={t.home.verifiedCount(num(sellers.filter((s) => s.verified).length))} />
        </div>
      </div>

      <CategoryTiles />

      <Shelf>
        <SectionHeader title={t.home.allProducts} href={`${prefix}/search/`} linkLabel={t.common.seeAll} />
        <CardGrid items={allProducts} />
      </Shelf>

      <Shelf>
        <SectionHeader title={t.home.spotlight} href={`${prefix}/search/`} linkLabel={t.common.seeAll} />
        <div className="-mx-4 grid divide-y divide-line-soft md:mx-0 md:grid-cols-2 md:gap-x-6 md:divide-y-0">
          {popular.map((summary) => (
            <div key={summary.product.id} className="border-line-soft md:[&:nth-child(n+3)]:border-t">
              <ProductRow summary={summary} />
            </div>
          ))}
        </div>
      </Shelf>

      <Shelf>
        <SectionHeader title={t.home.brands} />
        <BrandMarquee brands={brands} />
      </Shelf>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Shelf>
          <SectionHeader title={t.home.sellers} subtitle={t.home.sellersSub} href={`${prefix}/sellers/`} linkLabel={t.common.seeAll} />
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
          <p className="text-xl font-bold">{t.home.reportTitle}</p>
          <SubmitPriceDialog
            trigger={(open) => (
              <button type="button" onClick={open} className="h-11 rounded-lg bg-brand px-5 font-bold text-brand-ink hover:bg-brand-hover">
                {t.home.reportCta}
              </button>
            )}
          />
        </section>
      </div>
    </div>
  );
}
