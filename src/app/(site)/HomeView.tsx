"use client";

import { BadgeCheck, ChevronRight, Laptop, Megaphone, Smartphone, TrendingDown, Watch } from "lucide-react";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { SubmitPriceDialog } from "@/components/forms/SubmitPriceDialog";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductRow } from "@/components/product/ProductRow";
import { SellerCard } from "@/components/seller/SellerCard";
import { Chip } from "@/components/ui/Chip";
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

function CardGrid({ items }: { items: ProductSummary[] }) {
  return (
    <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 sm:mx-0 sm:grid sm:grid-cols-3 sm:px-0 lg:grid-cols-5">
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

function CategoryShelf({ summaries }: { summaries: ProductSummary[] }) {
  const { t } = useI18n();
  const [category, setCategory] = useState<Category>("mobile");
  const top = summaries.filter((s) => s.product.category === category).sort(byPopularity).slice(0, 5);
  return (
    <Shelf>
      <SectionHeader title={t.home.byCategory} href={`/search/?category=${category}`} linkLabel={t.common.seeAll} />
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0">
        {CATEGORIES.map(({ id }) => (
          <Chip key={id} selected={id === category} onClick={() => setCategory(id)}>
            {t.category[id].label}
          </Chip>
        ))}
      </div>
      <CardGrid items={top} />
    </Shelf>
  );
}

export function HomeView({ initial }: { initial: HomeData }) {
  const { lang, t, num } = useI18n();
  const { data } = useAsync(loadHome, [], initial);
  const { summaries, sellers, settings } = data ?? initial;

  const drops = summaries.filter((s) => s.drop).sort((a, b) => (b.drop ?? 0) - (a.drop ?? 0)).slice(0, 5);
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
              <Link key={q} href={`/search/?q=${encodeURIComponent(q)}`} className="rounded-full border border-white/25 px-4 py-2 text-sm font-semibold text-white hover:bg-white hover:text-brand">
                {q}
              </Link>
            ))}
          </div>
        </section>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-1 lg:gap-4">
          <HighlightTile href="/search/?sort=drop" icon={TrendingDown} title={t.home.drops} body={t.search.count(num(drops.length))} />
          <HighlightTile href="/sellers/" icon={BadgeCheck} title={t.home.sellersSub} body={t.home.verifiedCount(num(sellers.filter((s) => s.verified).length))} />
        </div>
      </div>

      <section className="grid grid-cols-3 gap-3">
        {CATEGORIES.map(({ id, icon: Icon }) => (
          <Link key={id} href={`/search/?category=${id}`} className="group flex flex-col items-center gap-2 rounded-lg bg-surface p-4 text-center shadow-sm ring-1 ring-line-soft transition-shadow hover:shadow-md md:flex-row md:gap-4 md:p-5 md:text-left">
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

      {drops.length > 0 && (
        <Shelf>
          <SectionHeader title={t.home.drops} href="/search/?sort=drop" linkLabel={t.common.seeAll} />
          <CardGrid items={drops} />
        </Shelf>
      )}

      <CategoryShelf summaries={summaries} />

      <Shelf>
        <SectionHeader title={t.home.spotlight} href="/search/" linkLabel={t.common.seeAll} />
        <div className="-mx-4 grid divide-y divide-line-soft md:mx-0 md:grid-cols-2 md:gap-x-6 md:divide-y-0">
          {popular.map((summary) => (
            <div key={summary.product.id} className="md:border-b md:border-line-soft">
              <ProductRow summary={summary} />
            </div>
          ))}
        </div>
      </Shelf>

      <Shelf>
        <SectionHeader title={t.home.brands} />
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
          {brands.map((brand) => (
            <Link key={brand} href={`/search/?brand=${encodeURIComponent(brand)}`} className="flex h-14 items-center justify-center rounded-md border border-line text-[15px] font-bold tracking-tight text-dim hover:border-brand hover:text-brand">
              {brand}
            </Link>
          ))}
        </div>
      </Shelf>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Shelf>
          <SectionHeader title={t.home.sellers} subtitle={t.home.sellersSub} href="/sellers/" linkLabel={t.common.seeAll} />
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
