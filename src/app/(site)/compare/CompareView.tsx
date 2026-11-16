"use client";

import { BatteryCharging, Camera, Check, Cpu, Info, ListChecks, Plus, Search, Shield, Store, Tag, X, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, type RefObject } from "react";
import { ProductIcon } from "@/components/product/ProductIcon";
import { ErrorNotice } from "@/components/ui/ErrorNotice";
import { ShareButton } from "@/components/ui/ShareButton";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { useAsync } from "@/hooks/useAsync";
import { useCategories } from "@/hooks/useCategories";
import { useI18n } from "@/hooks/useI18n";
import { listSummaries, loadChunk, loadManifest } from "@/services/catalog";
import { cardOffer } from "@/services/catalog-core";
import type { Condition, Offer, PricePoint, ProductSummary, SpecGroup } from "@/types/catalog";
import { dailyRange } from "@/utils/catalog";
import { conditionLabel } from "@/utils/categories";
import { bestOf, hasBar, sizeKey, specNumbers, specWinners } from "@/utils/compare";
import { compareShare } from "@/utils/compare-share";
import { formatTaka } from "@/utils/format";
import { rankProducts } from "@/utils/search";
import { keySpecs, type KeySpec } from "@/utils/specs";

const PICK_LIMIT = 8;
const MIN_KEY_ROWS = 4;
const MAX_EXTRA_ROWS = 15;
const LONG_VALUE = 180;
const LONG_VALUE_MANY = 70;
const MAX_ITEMS = 3;
const VERSION_SEPARATOR = "|";
const COLS = ["grid-cols-1", "grid-cols-1", "grid-cols-2", "grid-cols-3"];
const CATCH_ALL = /^(others?|other features|features|miscellaneous)$/i;

type Group = "price" | "performance" | "camera" | "battery" | "build" | "more";

const GROUPS: { id: Group; icon: LucideIcon; keys: KeySpec[] }[] = [
  { id: "price", icon: Tag, keys: [] },
  { id: "performance", icon: Cpu, keys: ["display", "chip", "graphics", "os"] },
  { id: "camera", icon: Camera, keys: ["rearCamera", "frontCamera"] },
  { id: "battery", icon: BatteryCharging, keys: ["battery", "charging"] },
  { id: "build", icon: Shield, keys: ["network", "water", "weight"] },
  { id: "more", icon: ListChecks, keys: [] },
];

const KEY_ALIASES: Record<KeySpec, RegExp> = {
  display: /display|screen|refresh rate|^size$/i,
  chip: /chipset|processor|cpu|^chip$/i,
  graphics: /graphics|gpu/i,
  rearCamera: /camera|^resolution$|^rear$/i,
  frontCamera: /camera|^resolution$|^front$|webcam/i,
  battery: /battery|^capacity$/i,
  charging: /charging|adapter|^output$/i,
  os: /operating system|^os$/i,
  network: /^network|^connection type$|^connectivity$|^wifi$|^bluetooth$/i,
  water: /ip ?rating|ip\d|water|rugged/i,
  weight: /^weight$/i,
};

const BAR_WIDTHS = ["w-1/12", "w-2/12", "w-3/12", "w-4/12", "w-5/12", "w-6/12", "w-7/12", "w-8/12", "w-9/12", "w-10/12", "w-11/12", "w-full"];

interface Row {
  key: string;
  group: Group;
  label: string;
  values: string[];
  numbers: (number | null)[];
  bars: boolean;
  winners: number[];
  win: string;
  hint?: string;
  shops?: (Shop[] | null)[];
}

interface Shop {
  name: string;
  price: number;
  url: string | null;
}

interface Choice {
  id: string;
  label: string;
  price: number | null;
  condition: Condition | null;
  inStock: boolean;
  shops: Shop[];
  sellerCount: number;
  trend: number | null;
}

interface Detail {
  specs: SpecGroup[];
  choices: Choice[];
  start: string | null;
}

// কলামে যা দেখায়: বাছা ভার্সনের দাম, না থাকলে (ডেটা আসার আগে) কার্ডের দাম
interface View {
  summary: ProductSummary;
  detail?: Detail;
  choice: Choice | null;
  price: number | null;
  label: string | null;
  condition: Condition | null;
  inStock: boolean;
  sellerCount: number;
}

const TOP_SHOPS = 3;
const TREND_DAYS = 30;

// পণ্যের পাতার দাম-চার্টের একই হিসাব: এক মাসে সবচেয়ে কম দাম কত বদলেছে (নতুন দোকান কম দামে এলেও ক্রেতার জন্য সেটা কম দাম)
function trendOf(offers: Offer[], history: PricePoint[]): number | null {
  const ids = new Set(offers.map((o) => o.id));
  const days = dailyRange(history.filter((h) => ids.has(h.offerId)), offers, TREND_DAYS);
  return days.length > 1 ? days[days.length - 1].low - days[0].low : null;
}

function choiceOf(id: string, label: string, offers: Offer[], history: PricePoint[], sellers: Map<string, string>): Choice {
  const available = offers.filter((o) => o.inStock !== false);
  const pool = available.length ? available : offers;
  const best = pool.reduce((a, b) => (b.price < a.price ? b : a));
  const seen = new Set<string>();
  // একই ধরনের ওয়ারেন্টির দোকানই পাশাপাশি, নইলে অফিসিয়াল-আনঅফিসিয়ালের দাম মিশে যায়
  const shops = available
    .filter((o) => o.condition === best.condition && sellers.get(o.sellerId))
    .sort((a, b) => a.price - b.price)
    .filter((o) => !seen.has(o.sellerId) && seen.add(o.sellerId))
    .slice(0, TOP_SHOPS)
    .map((o) => ({ name: sellers.get(o.sellerId) ?? "", price: o.price, url: o.url }));
  const sellerCount = new Set(offers.map((o) => o.sellerId)).size;
  return { id, label, price: best.price, condition: best.condition, inStock: available.length > 0, shops, sellerCount, trend: trendOf(offers.filter((o) => o.condition === best.condition), history) };
}

async function loadDetails(items: ProductSummary[]): Promise<Detail[]> {
  const [manifest, chunks] = await Promise.all([loadManifest(), Promise.all([...new Set(items.map((s) => s.product.category))].map(loadChunk))]);
  const products = new Map(chunks.flatMap((c) => c.products).map((p) => [p.slug, p]));
  const offers = chunks.flatMap((c) => c.offers);
  const history = chunks.flatMap((c) => c.history);
  const sellers = new Map(manifest.sellers.map((seller) => [seller.id, seller.name]));
  return items.map((s) => {
    const product = products.get(s.product.slug);
    if (!product) return { specs: [], choices: [], start: null };
    const choices = product.variants.flatMap((v) => {
      const own = offers.filter((o) => o.variantId === v.id);
      return own.length ? [choiceOf(v.id, v.label, own, history, sellers)] : [];
    });
    return { specs: product.specs ?? [], choices, start: cardOffer(offers, product).best?.variantId ?? null };
  });
}

const differs = (row: Row) => new Set(row.values).size > 1;

// অফিসিয়াল-আনঅফিসিয়াল বা আলাদা ভার্সনের (128GB বনাম 256GB) দাম মিলিয়ে "কম দাম" বলা যায় না
function pricesComparable(views: View[]) {
  if (views.some((v) => !v.choice) || new Set(views.map((v) => v.condition)).size !== 1) return false;
  return new Set(views.map((v) => sizeKey(v.label)).filter(Boolean)).size <= 1;
}

function useRows(views: View[], details: Detail[] | null): Row[] {
  const { t, num, lang } = useI18n();
  if (views.length < 2) return [];
  const comparable = pricesComparable(views);
  const taka = (n: number) => formatTaka(n, lang);
  const trendText = (n: number | null) => (n === null ? "—" : n < 0 ? t.compare.trendDown(taka(-n)) : n > 0 ? t.compare.trendUp(taka(n)) : t.compare.trendSame);
  const rows: Row[] = [
    {
      key: "price",
      group: "price",
      label: t.compare.price,
      values: views.map((v) => (v.price !== null ? taka(v.price) : "—")),
      numbers: views.map((v) => v.price),
      bars: false,
      winners: comparable ? bestOf(views.map((v) => (v.inStock ? v.price : null)), "lower") : [],
      win: t.compare.wins.price,
      hint: details && !comparable ? t.compare.priceHint : undefined,
    },
  ];
  if (details) {
    rows.push(
      {
        key: "topShops",
        group: "price",
        label: t.compare.topShops,
        values: views.map((v) => v.choice?.shops.map((shop) => `${shop.name} ${shop.price}`).join(",") || "—"),
        numbers: views.map(() => null),
        bars: false,
        winners: [],
        win: "",
        shops: views.map((v) => (v.choice?.shops.length ? v.choice.shops : null)),
      },
      { key: "trend", group: "price", label: t.compare.trend, values: views.map((v) => trendText(v.choice?.trend ?? null)), numbers: views.map(() => null), bars: false, winners: [], win: "" },
    );
  }
  rows.push({ key: "shops", group: "price", label: t.compare.shops, values: views.map((v) => t.compare.shopCount(num(v.sellerCount))), numbers: views.map(() => null), bars: false, winners: [], win: "" });
  if (!details) return rows;
  const maps = details.map((d) => new Map(keySpecs(d.specs).map((row) => [row.key, row.value])));
  const shownKeys: KeySpec[] = [];
  for (const { id, keys } of GROUPS) {
    for (const key of keys) {
      const raw = maps.map((m) => m.get(key));
      if (raw.every((v) => !v)) continue;
      shownKeys.push(key);
      const numbers = specNumbers(key, raw);
      const winners = specWinners(key, numbers);
      const win = key in t.compare.wins ? t.compare.wins[key as keyof typeof t.compare.wins] : t.compare.better;
      rows.push({ key, group: id, label: t.keySpec[key], values: raw.map((v) => v ?? "—"), numbers, bars: winners.length > 0 && hasBar(key), winners, win });
    }
  }
  if (shownKeys.length < MIN_KEY_ROWS) rows.push(...sharedRows(details, shownKeys));
  return rows;
}

function sharedRows(details: Detail[], shownKeys: KeySpec[]): Row[] {
  const covered = (label: string) => CATCH_ALL.test(label) || shownKeys.some((key) => KEY_ALIASES[key].test(label));
  const maps = details.map((d) => {
    const map = new Map<string, { label: string; value: string }>();
    for (const item of d.specs.flatMap((g) => g.items)) {
      const label = item.label.trim();
      const id = label.toLowerCase();
      if (!map.has(id) && !covered(label)) map.set(id, { label, value: item.value });
    }
    return map;
  });
  const order = [...new Set(maps.flatMap((m) => [...m.keys()]))];
  return order
    .filter((id) => maps.filter((m) => m.has(id)).length >= 2)
    .slice(0, MAX_EXTRA_ROWS)
    .map((id) => ({
      key: `more-${id}`,
      group: "more" as const,
      label: maps.find((m) => m.has(id))?.get(id)?.label ?? id,
      values: maps.map((m) => m.get(id)?.value ?? "—"),
      numbers: maps.map(() => null),
      bars: false,
      winners: [],
      win: "",
    }));
}

function Picker({ items, summaries, searchRef, onPick, onClose }: { items: ProductSummary[]; summaries: ProductSummary[]; searchRef: RefObject<HTMLInputElement | null>; onPick: (slug: string) => void; onClose?: () => void }) {
  const { t, lang } = useI18n();
  const { categories } = useCategories();
  const [query, setQuery] = useState("");
  const taken = new Set(items.map((s) => s.product.slug));
  const category = items[0]?.product.category;
  const pool = summaries.filter((s) => s.product.comparable && (!category || s.product.category === category) && !taken.has(s.product.slug));
  const prices = items.flatMap((s) => (s.lowest !== null ? [s.lowest] : []));
  const target = prices.length ? prices.reduce((sum, p) => sum + p, 0) / prices.length : null;
  const distance = (s: ProductSummary) => (target === null ? 0 : s.lowest === null ? Infinity : Math.abs(s.lowest - target));
  const matches = query.trim()
    ? rankProducts(pool, (s) => s.product, query, categories).map((r) => r.item)
    : [...pool].sort((a, b) => distance(a) - distance(b) || b.product.popularity - a.product.popularity);

  return (
    <section className="flex flex-col gap-3 rounded-lg bg-surface p-4 ring-1 ring-line">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-bold">{t.compare.pickTitle}</h2>
        {onClose && (
          <button type="button" onClick={onClose} className="text-sm font-semibold text-dim hover:text-ink hover:underline">
            {t.compare.close}
          </button>
        )}
      </div>
      <label className="flex h-11 items-center gap-2 rounded-md border border-line px-3 transition-shadow focus-within:border-brand focus-within:ring-4 focus-within:ring-brand/25">
        <Search size={16} className="shrink-0 text-dim" aria-hidden="true" />
        <input ref={searchRef} autoFocus={Boolean(onClose)} value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t.compare.pickHint} aria-label={t.compare.pickHint} className="w-full min-w-0 bg-transparent text-sm outline-none" />
      </label>
      {!query.trim() && matches.length > 0 && <span className="text-xs font-semibold text-dim">{t.compare.popular}</span>}
      {matches.length === 0 ? (
        <p className="py-4 text-center text-sm text-dim">{query.trim() ? t.compare.noMatch(query.trim()) : t.compare.noOthers}</p>
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2">
          {matches.slice(0, PICK_LIMIT).map((s) => (
            <li key={s.product.id}>
              <button type="button" onClick={() => onPick(s.product.slug)} className="flex w-full items-center gap-3 rounded-md border border-line-soft p-2 text-left transition-colors hover:border-brand">
                <ProductIcon product={s.product} size="sm" />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm font-semibold">{s.product.name}</span>
                  <span className="text-xs text-dim">{s.product.brand}</span>
                </span>
                {s.lowest !== null && <span className="shrink-0 text-sm font-bold">{formatTaka(s.lowest, lang)}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Column({ view, many, onPick, onRemove }: { view: View; many: boolean; onPick: (id: string) => void; onRemove?: () => void }) {
  const { t, num, lang, prefix } = useI18n();
  const { find } = useCategories();
  const { summary, detail, choice, price: lowest, label: size, condition, inStock, sellerCount } = view;
  const { product } = summary;
  const shop = choice?.shops[0]?.name;
  const choices = detail?.choices ?? [];
  const href = `${prefix}/product/${product.slug}/`;
  const warranty = find(product.category)?.warranty !== false;
  const kind = condition ? conditionLabel(t, condition, warranty) : null;
  const tiny = many ? "text-[11px] sm:text-xs" : "text-xs";

  return (
    <div className={`flex h-full w-full min-w-0 flex-col lg:flex-row lg:items-start lg:gap-5 ${many ? "gap-2 sm:gap-3" : "gap-3"}`}>
      <div className="relative w-full md:mx-auto md:max-w-56 lg:mx-0 lg:w-40 lg:shrink-0">
        <Link href={href} className="flex aspect-square items-center justify-center rounded-md bg-white p-1 ring-1 ring-line-soft">
          <ProductIcon product={product} size="fill" plain />
        </Link>
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            aria-label={t.compare.remove(product.name)}
            className={`absolute flex items-center justify-center rounded-full bg-surface text-ink shadow-md ring-1 ring-line transition-colors hover:bg-sale-soft hover:text-sale hover:ring-sale ${many ? "top-1 right-1 size-6 sm:top-1.5 sm:right-1.5 sm:size-8" : "top-1.5 right-1.5 size-8"}`}
          >
            <X className={many ? "size-3.5 sm:size-4" : "size-4"} strokeWidth={2.5} aria-hidden="true" />
          </button>
        )}
      </div>
      <div className={`flex min-w-0 flex-1 flex-col lg:self-stretch ${many ? "gap-1 sm:gap-1.5" : "gap-1.5"}`}>
        <span className={`truncate text-[11px] font-semibold tracking-wider text-dim uppercase ${many ? "hidden sm:block" : ""}`}>{product.brand}</span>
        <Link href={href} className={`line-clamp-2 font-semibold hover:text-brand ${many ? "min-h-8 text-xs leading-4 sm:min-h-10 sm:text-[13px] sm:leading-5 md:text-sm" : "min-h-10 text-sm leading-5 md:text-base md:leading-6"}`}>
          {product.name}
        </Link>
        <span className={`leading-tight font-bold tracking-tight text-ink ${many ? "text-sm sm:text-base md:text-lg" : "text-lg md:text-xl"}`}>{lowest !== null ? formatTaka(lowest, lang) : t.compare.noPrice}</span>
        {choices.length > 1 && many && (
          <select
            value={choice?.id}
            onChange={(e) => onPick(e.target.value)}
            aria-label={t.compare.versionOf(product.name)}
            className="h-7 w-full rounded-xs border border-brand bg-brand-soft px-1 text-[11px] font-semibold text-brand-text sm:hidden"
          >
            {choices.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        )}
        {choices.length > 1 && (
          <div role="group" aria-label={t.compare.versionOf(product.name)} className={`flex-wrap gap-1 ${many ? "hidden sm:flex" : "flex"}`}>
            {choices.map((c) => (
              <button
                key={c.id}
                type="button"
                aria-pressed={c.id === choice?.id}
                onClick={() => onPick(c.id)}
                className={`rounded-xs border px-1.5 py-0.5 font-semibold transition-colors ${tiny} ${c.id === choice?.id ? "border-brand bg-brand-soft text-brand-text" : "border-line text-dim hover:border-brand hover:text-ink"}`}
              >
                {c.label}
              </button>
            ))}
          </div>
        )}
        <span className={`flex flex-wrap items-center gap-1 ${tiny}`}>
          {size && choices.length <= 1 && <span className="font-semibold text-ink">{size}</span>}
          {kind && (
            <span className={`rounded-xs py-px font-semibold whitespace-nowrap ${many ? "px-0.5 text-[10px] sm:px-1 sm:text-xs" : "px-1"} ${condition === "official" ? "bg-surface-2 text-dim" : "bg-gold-soft text-gold-text"}`}>
              {kind}
            </span>
          )}
          {!inStock && <span className="rounded-xs bg-sale-soft px-1 py-px font-semibold text-sale">{t.stock.no}</span>}
        </span>
        {shop && (
          <span className={`flex min-w-0 items-start gap-1 text-ink ${tiny}`}>
            <Store size={13} className={`mt-px shrink-0 text-brand ${many ? "hidden sm:block" : ""}`} aria-hidden="true" />
            <span className={`min-w-0 ${many ? "line-clamp-2 sm:line-clamp-none" : ""}`}>
              {many ? (
                <>
                  <span className="sm:hidden">{shop}</span>
                  <span className="hidden sm:inline">{t.compare.cheapestAt(shop)}</span>
                </>
              ) : (
                t.compare.cheapestAt(shop)
              )}
            </span>
          </span>
        )}
        <span className={`text-dim ${tiny}`}>{t.home.shopsAt(num(sellerCount))}</span>
        <Link
          href={href}
          className={`mt-auto inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-cta text-center leading-tight font-bold text-cta-ink shadow-sm transition-colors hover:bg-cta-hover ${many ? "min-h-8 px-1.5 py-1 text-xs sm:min-h-9 sm:px-2.5 sm:py-1.5 sm:text-[13px]" : "min-h-9 px-2.5 py-1.5 text-[13px]"}`}
        >
          <Store size={15} className={`shrink-0 ${many ? "hidden sm:block" : ""}`} aria-hidden="true" />
          {many ? (
            <>
              <span className="sm:hidden">{t.compare.shopPricesShort}</span>
              <span className="hidden sm:inline">{t.compare.shopPrices}</span>
            </>
          ) : (
            t.compare.shopPrices
          )}
        </Link>
      </div>
    </div>
  );
}

function Edge({ items, rows }: { items: ProductSummary[]; rows: Row[] }) {
  const { t, num } = useI18n();
  return (
    <section className="flex flex-col gap-3 rounded-lg bg-surface p-4 ring-1 ring-line">
      <h2 className="font-bold">{t.compare.edge}</h2>
      <div className="grid gap-3 md:grid-cols-2">
        {items.map((summary, side) => {
          const wins = rows.filter((r) => r.winners.includes(side));
          return (
            <div key={summary.product.id} className="flex gap-3 rounded-md border border-line-soft p-3">
              <ProductIcon product={summary.product} size="sm" />
              <div className="flex min-w-0 flex-col gap-2">
                <span className="text-sm font-semibold">
                  {summary.product.name}
                  <span className="font-normal text-dim"> · {wins.length ? t.compare.aheadIn(num(wins.length)) : t.compare.aheadNone}</span>
                </span>
                {wins.length > 0 && (
                  <span className="flex flex-wrap gap-1.5">
                    {wins.map((r) => (
                      <span key={r.key} className="inline-flex items-center gap-1 rounded-xs bg-ok-soft px-1.5 py-0.5 text-xs font-semibold text-ok">
                        <Check size={12} aria-hidden="true" />
                        {r.win}
                      </span>
                    ))}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function Bar({ value, max, win }: { value: number | null; max: number; win: boolean }) {
  if (value === null || max <= 0) return null;
  const width = BAR_WIDTHS[Math.max(0, Math.round((value / max) * BAR_WIDTHS.length) - 1)];
  return (
    <span className="mt-auto block h-1 rounded-full bg-line-soft">
      <span className={`block h-1 rounded-full ${width} ${win ? "bg-ok" : "bg-dim/40"}`} />
    </span>
  );
}

function ShopList({ shops }: { shops: Shop[] | null }) {
  const { lang } = useI18n();
  if (!shops) return <span>—</span>;
  return (
    <ul className="flex flex-col gap-1">
      {shops.map((shop) => (
        <li key={shop.name} className="flex flex-wrap items-baseline justify-between gap-x-2">
          {shop.url ? (
            <a href={shop.url} target="_blank" rel="noopener nofollow" className="max-w-full truncate hover:text-brand hover:underline">
              {shop.name}
            </a>
          ) : (
            <span className="max-w-full truncate">{shop.name}</span>
          )}
          <span className="shrink-0 font-semibold">{formatTaka(shop.price, lang)}</span>
        </li>
      ))}
    </ul>
  );
}

function Table({ items, prices, labels, rows, loading, failed, onRetry }: { items: ProductSummary[]; prices: (number | null)[]; labels: (string | null)[]; rows: Row[]; loading: boolean; failed: boolean; onRetry: () => void }) {
  const { t, lang } = useI18n();
  const [onlyDiff, setOnlyDiff] = useState(false);
  const [opened, setOpened] = useState<string[]>([]);
  const cols = COLS[items.length];
  const many = items.length > 2;
  const shown = onlyDiff ? rows.filter(differs) : rows;

  return (
    <section className="rounded-lg bg-surface ring-1 ring-line">
      <div className="flex items-center justify-between gap-3 px-4 pt-4 pb-3">
        <h2 className="font-bold">{t.compare.specs}</h2>
        <button
          type="button"
          role="switch"
          aria-checked={onlyDiff}
          onClick={() => setOnlyDiff(!onlyDiff)}
          className="flex shrink-0 items-center gap-2 text-[13px] font-semibold text-dim hover:text-ink"
        >
          {t.compare.onlyDiff}
          <span className={`flex h-5 w-9 items-center rounded-full p-0.5 transition-colors ${onlyDiff ? "bg-brand" : "bg-line"}`}>
            <span className={`size-4 rounded-full bg-surface shadow transition-transform ${onlyDiff ? "translate-x-4" : ""}`} />
          </span>
        </button>
      </div>
      <div className={`sticky top-[var(--header-h,4rem)] z-10 grid ${cols} border-y border-line-soft bg-surface py-2 md:gap-4 ${many ? "gap-2 px-3 sm:gap-3 sm:px-4" : "gap-3 px-4"}`}>
        {items.map((s, i) => (
          <div key={s.product.id} className="flex min-w-0 items-center gap-2">
            <span className={many ? "hidden md:block" : ""}>
              <ProductIcon product={s.product} size="xs" />
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="truncate text-[13px] font-semibold">{s.product.name}</span>
              {prices[i] != null && (
                <span className="truncate text-xs text-dim">
                  {formatTaka(prices[i], lang)}
                  {labels[i] && ` · ${labels[i]}`}
                </span>
              )}
            </span>
          </div>
        ))}
      </div>
      {GROUPS.map(({ id, icon: Icon }) => {
        const groupRows = shown.filter((row) => row.group === id);
        if (!groupRows.length) return null;
        return (
          <div key={id}>
            <h3 className="flex items-center gap-2 border-b border-line-soft bg-surface-2 px-4 py-2 text-xs font-semibold tracking-wide text-dim uppercase">
              <Icon size={14} aria-hidden="true" />
              {t.compare.groups[id]}
            </h3>
            <dl className={`divide-y divide-line-soft ${many ? "text-xs sm:text-[13px] md:text-sm" : "text-sm"}`}>
              {groupRows.map((row) => {
                const max = Math.max(...row.numbers.map((n) => n ?? 0));
                const longWide = row.values.some((v) => v.length > LONG_VALUE);
                const long = !row.shops && (longWide || (many && row.values.some((v) => v.length > LONG_VALUE_MANY)));
                const clamped = long && !opened.includes(row.key);
                const clampClass = clamped ? (longWide ? "line-clamp-4" : "line-clamp-4 sm:line-clamp-none") : "";
                return (
                  <div key={row.key} className={many ? "px-3 py-2.5 sm:px-4 sm:py-3" : "px-4 py-3"}>
                    <dt className="mb-1.5 text-xs font-semibold text-dim">{row.label}</dt>
                    {row.hint && (
                      <p className="mb-2 flex items-start gap-1.5 text-[11px] text-dim">
                        <Info size={13} className="mt-px shrink-0" aria-hidden="true" />
                        {row.hint}
                      </p>
                    )}
                    <div className={`grid ${cols} md:gap-4 ${many ? "gap-2 sm:gap-3" : "gap-3"}`}>
                      {row.values.map((value, side) => {
                        const won = row.winners.includes(side);
                        return (
                          <dd
                            key={side}
                            className={`flex min-w-0 flex-col gap-1.5 ${row.winners.length ? `rounded-md py-1.5 ${many ? "-mx-1 px-1 sm:-mx-2 sm:px-2" : "-mx-2 px-2"}` : ""} ${won ? "bg-ok-soft text-ink" : differs(row) ? "text-ink" : "text-dim"}`}
                          >
                            {row.winners.length > 0 && (
                              <span aria-hidden={!won} className={`-mb-1 flex items-center gap-1 text-[11px] font-bold text-ok ${won ? "" : "invisible"}`}>
                                <Check size={13} className="shrink-0" aria-hidden="true" />
                                {row.win}
                              </span>
                            )}
                            {row.shops ? (
                              <ShopList shops={row.shops[side]} />
                            ) : (
                              <span className={`break-words whitespace-pre-line ${clampClass || "block"}`}>{value}</span>
                            )}
                            {row.bars && <Bar value={row.numbers[side]} max={max} win={won} />}
                          </dd>
                        );
                      })}
                    </div>
                    {long && (
                      <button
                        type="button"
                        onClick={() => setOpened(clamped ? [...opened, row.key] : opened.filter((k) => k !== row.key))}
                        className={`mt-1.5 text-xs font-semibold text-brand-text hover:underline ${longWide ? "" : "sm:hidden"}`}
                      >
                        {clamped ? t.compare.showAll : t.compare.showLess}
                      </button>
                    )}
                  </div>
                );
              })}
            </dl>
          </div>
        );
      })}
      {onlyDiff && !shown.length && <p className="px-4 py-6 text-center text-sm text-dim">{t.compare.noDiff}</p>}
      {loading && <ListSkeleton rows={3} />}
      {failed && (
        <div className="p-4">
          <ErrorNotice onRetry={onRetry} />
        </div>
      )}
    </section>
  );
}

export function CompareView() {
  const { t, num, lang } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [picking, setPicking] = useState(false);
  const pickerSearch = useRef<HTMLInputElement>(null);
  const requested = [...new Set((params.get("p") ?? "").split(",").filter(Boolean))];
  const { data, error, loading, reload } = useAsync(listSummaries, []);
  const found = requested.flatMap((slug) => data?.find((s) => s.product.slug === slug) ?? []);
  const items = found.filter((s) => s.product.category === found[0]?.product.category).slice(0, MAX_ITEMS);
  const dropped = requested.length - items.length;
  const key = items.map((s) => s.product.slug).join(",");
  const details = useAsync(() => (items.length > 1 ? loadDetails(items).then((list) => ({ key, list })) : Promise.resolve(null)), [key, data]);
  const current = details.data?.key === key ? details.data.list : null;
  // বাছা ভার্সন লিংকে থাকে (&v=256GB|1TB, p-এর ক্রমে), তাই শেয়ার বা reload করলেও একই ভার্সন খোলে
  const versions = (params.get("v") ?? "").split(VERSION_SEPARATOR);
  const versionOf = (slug: string) => versions[requested.indexOf(slug)] || null;
  const views: View[] = items.map((summary, i) => {
    const detail = current?.[i];
    const wanted = versionOf(summary.product.slug);
    const choice = detail?.choices.find((c) => (wanted ? c.label === wanted : c.id === detail.start)) ?? detail?.choices.find((c) => c.id === detail.start) ?? detail?.choices[0] ?? null;
    return choice
      ? { summary, detail, choice, price: choice.price, label: choice.label, condition: choice.condition, inStock: choice.inStock, sellerCount: choice.sellerCount }
      : { summary, detail, choice: null, price: summary.lowest, label: summary.size, condition: summary.condition, inStock: summary.inStock, sellerCount: summary.sellerCount };
  });
  const rows = useRows(views, current);
  const share = items.length ? compareShare(t, lang, views.map((v) => ({ brand: v.summary.product.brand, name: v.summary.product.name, lowest: v.price }))) : null;
  const shareTitle = share?.title;
  const shareDescription = items.length > 1 ? share?.description : null;

  // পাতার ভেতরে পণ্য বদলালে Next নিজের static শিরোনাম আবার বসায়, তাই বদলালেই আমাদেরটা ফিরিয়ে দিই
  useEffect(() => {
    if (!shareTitle) return;
    const site = document.title.split(" | ").at(-1);
    const wanted = site && site !== document.title ? `${shareTitle} | ${site}` : shareTitle;
    const apply = () => {
      if (document.title !== wanted) document.title = wanted;
      const meta = document.querySelector('meta[name="description"]');
      if (shareDescription && meta?.getAttribute("content") !== shareDescription) meta?.setAttribute("content", shareDescription);
    };
    apply();
    const observer = new MutationObserver(apply);
    observer.observe(document.head, { subtree: true, childList: true, characterData: true, attributes: true });
    return () => observer.disconnect();
  }, [shareTitle, shareDescription]);

  const go = (next: { slug: string; version: string | null }[]) => {
    const chosen = next.map((n) => n.version ?? "");
    const v = chosen.some(Boolean) ? `&v=${encodeURIComponent(chosen.join(VERSION_SEPARATOR))}` : "";
    router.replace(`${pathname}?p=${next.map((n) => encodeURIComponent(n.slug)).join(",")}${v}`, { scroll: false });
  };
  const selection = () => items.map((s) => ({ slug: s.product.slug, version: versionOf(s.product.slug) }));
  const add = (slug: string) => {
    setPicking(false);
    go([...selection(), { slug, version: null }]);
  };
  const remove = (slug: string) => go(selection().filter((n) => n.slug !== slug));
  const pick = (slug: string, id: string) => {
    const detail = current?.[items.findIndex((s) => s.product.slug === slug)];
    const label = detail?.choices.find((c) => c.id === id)?.label ?? null;
    go(selection().map((n) => (n.slug === slug ? { slug, version: id === detail?.start ? null : label } : n)));
  };

  if (loading) return <ListSkeleton rows={3} />;
  if (error && !data) return <ErrorNotice onRetry={reload} />;
  if (!data) return <ListSkeleton rows={3} />;

  const canAdd = items.length < MAX_ITEMS;
  const openSlots = Math.max(0, 2 - items.length);
  const many = items.length > 2;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold md:text-2xl">{t.compare.title}</h1>
        {items.length > 1 && (
          <ShareButton
            title={items.map((s) => s.product.name).join(` ${t.compare.vs} `)}
            label
            className="flex h-9 shrink-0 items-center gap-1.5 rounded-md border border-line bg-surface px-3 text-sm font-semibold text-dim hover:border-dim hover:text-ink"
          />
        )}
      </div>
      {dropped > 0 && (
        <p className="flex items-start gap-2 rounded-md border border-gold/30 bg-gold-soft px-3.5 py-2.5 text-[13px] text-gold-text">
          <Info size={15} className="mt-px shrink-0" aria-hidden="true" />
          {t.compare.dropped(num(dropped))}
        </p>
      )}
      <section className="flex flex-col gap-4 rounded-lg bg-surface p-3 ring-1 ring-line md:p-5">
        <div className={`@container relative grid divide-x divide-line-soft md:-mx-5 ${many ? "-mx-1.5 sm:-mx-3" : "-mx-3"} ${COLS[Math.max(2, items.length)]}`}>
          {items.length === 2 && (
            <span className="absolute top-[calc(25cqw-12px)] left-1/2 z-10 flex size-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-surface text-[11px] font-bold text-dim ring-1 ring-line md:top-1/2 md:size-9 md:text-xs">
              {t.compare.vs}
            </span>
          )}
          {items.map((summary, i) => (
            <div key={summary.product.id} className={`flex min-w-0 md:px-5 ${many ? "px-1.5 sm:px-3" : "px-3"}`}>
              <Column
                view={views[i]}
                onPick={(id) => pick(summary.product.slug, id)}
                many={many}
                onRemove={items.length > 1 ? () => remove(summary.product.slug) : undefined}
              />
            </div>
          ))}
          {Array.from({ length: openSlots }, (_, i) => (
            <div key={i} className="min-w-0 px-3 md:px-5">
              <button
                type="button"
                onClick={() => pickerSearch.current?.focus()}
                className="flex aspect-square w-full flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-line text-center text-sm font-semibold text-dim hover:border-brand hover:text-brand md:mx-auto md:max-w-56 lg:mx-0 lg:aspect-auto lg:h-40 lg:max-w-none"
              >
                <Plus size={22} aria-hidden="true" />
                {t.compare.pickSlot}
              </button>
            </div>
          ))}
        </div>
        {canAdd && items.length > 1 && !picking && (
          <button
            type="button"
            onClick={() => setPicking(true)}
            className="flex h-10 items-center justify-center gap-1.5 rounded-md border border-dashed border-line text-sm font-semibold text-dim hover:border-brand hover:text-brand"
          >
            <Plus size={16} aria-hidden="true" />
            {t.compare.addMore(num(MAX_ITEMS))}
          </button>
        )}
      </section>
      {canAdd && (openSlots > 0 || picking) && <Picker items={items} summaries={data} searchRef={pickerSearch} onPick={add} onClose={items.length > 1 ? () => setPicking(false) : undefined} />}
      {items.length > 1 && current && <Edge items={items} rows={rows} />}
      {items.length > 1 && <Table items={items} prices={views.map((v) => v.price)} labels={views.map((v) => (v.detail && v.detail.choices.length > 1 ? v.label : null))} rows={rows} loading={details.loading} failed={Boolean(details.error) && !current} onRetry={details.reload} />}
    </div>
  );
}
