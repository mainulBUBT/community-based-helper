"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { CategoryIcon } from "@/components/product/CategoryIcon";
import { ProductIcon } from "@/components/product/ProductIcon";
import { useCategories } from "@/hooks/useCategories";
import { useI18n } from "@/hooks/useI18n";
import { listSummaries } from "@/services/catalog";
import type { ProductSummary } from "@/types/catalog";
import { formatTaka } from "@/utils/format";
import { categoryPath } from "@/utils/url";

// মেনু পুরো স্ক্রিন জুড়ে না বসে; ভেতরের তালিকা নিজে স্ক্রল করে
const PANEL_HEIGHT = "max-h-[min(620px,calc(100dvh-7rem))]";

// তালিকার নিচে আরও থাকলে হালকা ছায়া; শেষে পৌঁছালে এটাই শেষ সারির নিচে ফাঁকা জায়গা
const SCROLL_FADE = "pointer-events-none sticky bottom-0 h-6 shrink-0 bg-gradient-to-t from-surface";

// ব্র্যান্ড আর তার পণ্যের সংখ্যা, বেশি পণ্য আগে
function byCount(summaries: ProductSummary[]) {
  const counts = new Map<string, number>();
  for (const s of summaries) counts.set(s.product.brand, (counts.get(s.product.brand) ?? 0) + 1);
  return [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

const initial = (brand: string) => {
  const letter = brand.charAt(0).toUpperCase();
  return /[A-Z]/.test(letter) ? letter : "#";
};

function useSummaries(enabled: boolean) {
  const [items, setItems] = useState<ProductSummary[] | null>(null);
  useEffect(() => {
    if (enabled && !items) listSummaries().then(setItems, () => setItems([]));
  }, [enabled, items]);
  return items ?? [];
}

function Dropdown({ label, children }: { label: string; children: (close: () => void) => ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const ref = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [seen, setSeen] = useState(pathname);
  if (seen !== pathname) {
    setSeen(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    const onClick = (event: MouseEvent) => !ref.current?.contains(event.target as Node) && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  const show = () => {
    clearTimeout(timer.current);
    setOpen(true);
  };
  const hide = () => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpen(false), 150);
  };

  return (
    <div ref={ref} onMouseEnter={show} onMouseLeave={hide} className="static">
      <button
        type="button"
        aria-expanded={open}
        onClick={show}
        className={`flex h-16 items-center gap-1 border-b-2 px-1 text-sm font-semibold transition-colors ${open ? "border-brand text-brand" : "border-transparent text-ink hover:text-brand"}`}
      >
        {label}
        <ChevronDown size={15} className={`transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>
      {open && (
        <div className="absolute inset-x-0 top-full z-50 max-h-[calc(100dvh-4rem)] overflow-y-auto overscroll-contain border-t border-line-soft bg-surface shadow-lg">
          <div className="page-container py-5">{children(() => setOpen(false))}</div>
        </div>
      )}
    </div>
  );
}

export function CategoryMenu() {
  const { t, lang, num, prefix } = useI18n();
  const { top, childrenOf, family } = useCategories();
  const [active, setActive] = useState(top[0]?.slug ?? "");
  const [opened, setOpened] = useState(false);
  const summaries = useSummaries(opened);
  const current = top.find((c) => c.slug === active) ?? top[0];
  if (!current) return null;

  const slugs = new Set(family(current.slug));
  const inCategory = summaries.filter((s) => slugs.has(s.product.category));
  const brands = byCount(inCategory).slice(0, 16).map(([brand]) => brand);
  const popular = [...inCategory].sort((a, b) => b.product.popularity - a.product.popularity).slice(0, 4);
  const children = childrenOf(current.slug);
  const label = (c: { name: string; nameEn: string }) => (lang === "en" ? c.nameEn : c.name);
  const count = (slug: string) => summaries.filter((s) => family(slug).includes(s.product.category)).length;

  return (
    <div onMouseEnter={() => setOpened(true)} onFocus={() => setOpened(true)}>
      <Dropdown label={t.nav.categories}>
        {(close) => (
          <div className="grid gap-6 md:grid-cols-[230px_minmax(0,1fr)]">
            <ul className={`flex flex-col gap-0.5 overflow-y-auto overscroll-contain border-r border-line-soft pr-3 ${PANEL_HEIGHT}`}>
              {top.filter((c) => !summaries.length || count(c.slug) > 0).map((c) => (
                <li key={c.slug}>
                  <Link
                    href={categoryPath(prefix, c.slug)}
                    onMouseEnter={() => setActive(c.slug)}
                    onFocus={() => setActive(c.slug)}
                    onClick={close}
                    className={`flex items-center gap-3 rounded-md px-3 py-1.5 text-sm font-semibold ${c.slug === current.slug ? "bg-brand-soft text-brand-text" : "text-ink hover:bg-surface-2"}`}
                  >
                    <CategoryIcon name={c.icon} size={17} />
                    <span className="flex-1">{label(c)}</span>
                    {summaries.length > 0 && <span className="text-xs font-normal text-dim">{num(count(c.slug))}</span>}
                    <ChevronRight size={15} className="text-faint" aria-hidden="true" />
                  </Link>
                </li>
              ))}
              <li aria-hidden="true" className={SCROLL_FADE} />
            </ul>
            <div className={`flex min-w-0 flex-col gap-4 overflow-y-auto overscroll-contain pb-4 ${PANEL_HEIGHT}`}>
              <div className="flex items-center justify-between gap-3">
                <span className="text-lg font-bold">{label(current)}</span>
                <Link href={categoryPath(prefix, current.slug)} onClick={close} className="text-sm font-semibold text-brand hover:underline">
                  {t.megaMenu.seeAll(label(current))} →
                </Link>
              </div>
              <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
                <div className="flex flex-col gap-5">
                  {children.length > 0 && (
                    <div className="flex flex-col gap-2">
                      <span className="text-[11px] font-semibold tracking-wider text-dim uppercase">{t.megaMenu.subcategories}</span>
                      <div className="flex flex-wrap gap-2">
                        {children.map((c) => (
                          <Link key={c.slug} href={categoryPath(prefix, c.slug)} onClick={close} className="rounded-full border border-line px-3 py-1.5 text-sm hover:border-brand hover:text-brand">
                            {label(c)}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex flex-col gap-2">
                    <span className="text-[11px] font-semibold tracking-wider text-dim uppercase">{t.megaMenu.brands}</span>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                      {brands.map((brand) => (
                        <Link key={brand} href={`${categoryPath(prefix, current.slug)}?brand=${encodeURIComponent(brand)}`} onClick={close} className="text-ink hover:text-brand">
                          {brand}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
                {popular.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <span className="text-[11px] font-semibold tracking-wider text-dim uppercase">{t.megaMenu.popular}</span>
                    <ul className="grid gap-2 sm:grid-cols-2">
                      {popular.map(({ product, lowest }) => (
                        <li key={product.id}>
                          <Link href={`${prefix}/product/${product.slug}/`} onClick={close} className="flex items-center gap-3 rounded-md border border-line-soft p-2 hover:border-brand">
                            <ProductIcon product={product} size="sm" plain />
                            <span className="flex min-w-0 flex-col">
                              <span className="truncate text-sm font-semibold">{product.name}</span>
                              {lowest && <span className="text-xs text-dim">{formatTaka(lowest, lang)}</span>}
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Dropdown>
    </div>
  );
}

export function BrandMenu() {
  const { t, num, prefix } = useI18n();
  const [opened, setOpened] = useState(false);
  const [query, setQuery] = useState("");
  const [letter, setLetter] = useState<string | null>(null);
  const summaries = useSummaries(opened);
  const brands = byCount(summaries).sort((a, b) => a[0].localeCompare(b[0], "en", { sensitivity: "base" }));
  const letters = [...new Set(brands.map(([brand]) => initial(brand)))];
  const needle = query.trim().toLowerCase();
  const shown = brands.filter(([brand]) => (needle ? brand.toLowerCase().includes(needle) : !letter || initial(brand) === letter));
  const chip = (on: boolean) =>
    `flex h-7 min-w-7 items-center justify-center rounded-md px-1.5 text-xs font-semibold ${on ? "bg-brand text-white" : "text-dim hover:bg-surface-2 hover:text-ink"}`;

  return (
    <div onMouseEnter={() => setOpened(true)} onFocus={() => setOpened(true)}>
      <Dropdown label={t.nav.brands}>
        {(close) => (
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-[11px] font-semibold tracking-wider text-dim uppercase">
                {t.megaMenu.allBrands} · {num(brands.length)}
              </span>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t.megaMenu.findBrand}
                aria-label={t.megaMenu.findBrand}
                className="h-9 w-64 rounded-md border border-line bg-surface px-3 text-sm outline-none focus:border-brand"
              />
            </div>
            <div className="flex flex-wrap gap-0.5" role="group" aria-label={t.megaMenu.byLetter}>
              <button type="button" onClick={() => setLetter(null)} className={chip(!letter && !needle)}>
                {t.megaMenu.allLetters}
              </button>
              {letters.map((l) => (
                <button key={l} type="button" onClick={() => { setLetter(l); setQuery(""); }} className={chip(letter === l && !needle)}>
                  {l}
                </button>
              ))}
            </div>
            <div className="max-h-[min(440px,calc(100dvh-15rem))] overflow-y-auto overscroll-contain pr-1">
              {shown.length ? (
                <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7">
                  {shown.map(([brand, count]) => (
                    <Link
                      key={brand}
                      href={`${prefix}/search/?brand=${encodeURIComponent(brand)}`}
                      onClick={close}
                      className="flex items-center gap-2 rounded-md border border-line-soft px-2.5 py-1.5 text-sm font-semibold hover:border-brand hover:text-brand"
                    >
                      <span className="flex-1 truncate">{brand}</span>
                      <span className="text-xs font-normal text-dim">{num(count)}</span>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="py-6 text-center text-sm text-dim">{t.megaMenu.noBrand}</p>
              )}
              <div aria-hidden="true" className={SCROLL_FADE} />
            </div>
          </div>
        )}
      </Dropdown>
    </div>
  );
}
