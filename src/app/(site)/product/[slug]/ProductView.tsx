"use client";

import { AlertTriangle, Check, ChevronDown, ChevronRight, Clock, ExternalLink, Globe, Megaphone, Phone, Store, TrendingDown } from "lucide-react";
import Link from "next/link";
import { useState, useSyncExternalStore, type ReactNode } from "react";
import { SubmitPriceDialog } from "@/components/forms/SubmitPriceDialog";
import { PageBanner } from "@/components/layout/PageBanner";
import { AlternativeCard } from "@/components/product/AlternativeCard";
import { OffersTable } from "@/components/product/OffersTable";
import { PriceChart } from "@/components/product/PriceChart";
import { ProductGallery } from "@/components/product/ProductGallery";
import { PriceAlertToggle } from "@/components/product/PriceAlertToggle";
import { SaveButton } from "@/components/product/SaveButton";
import { SectionNav } from "@/components/product/SectionNav";
import { SellerLogo } from "@/components/seller/SellerLogo";
import { VerifiedBadge } from "@/components/seller/VerifiedBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Panel } from "@/components/ui/Panel";
import { ShareButton } from "@/components/ui/ShareButton";
import { useCategories } from "@/hooks/useCategories";
import { useI18n } from "@/hooks/useI18n";
import { useSaved } from "@/hooks/useSaved";
import type { RegionNote } from "@/types/admin";
import { AXES, type Axis, type Condition, type OfferView, type ProductDetail, type SpecGroup, type Variant } from "@/types/catalog";
import { byStock, neverCharged, realOldPrice } from "@/utils/catalog";
import { categoryConditions, conditionLabel, isReplica } from "@/utils/categories";
import { formatTaka, telLink } from "@/utils/format";
import { primaryRegion } from "@/utils/region";
import { brandPath, categoryPath, hostOf } from "@/utils/url";
import { keySpecs, specHighlights } from "@/utils/specs";
import { sortAxisValues, variantLabel } from "@/utils/variants";

const imageFor = (images: string[], color?: string) => {
  if (!color) return 0;
  const slug = color.toLowerCase().replace(/\s+/g, "-");
  return Math.max(0, images.findIndex((src) => src.toLowerCase().includes(slug)));
};

// লিংকের ?v= ভার্সন — বেক করা HTML এ নেই, ব্রাউজারে hydration এর পরে একবারই পড়ে
const neverChanges = () => () => {};
const readUrlVariant = () => (typeof window === "undefined" ? null : new URLSearchParams(window.location.search).get("v"));

function BuyButton({ offer, className = "" }: { offer: OfferView; className?: string }) {
  const { t } = useI18n();
  const link = offer.url ?? offer.seller.website;
  const base = `flex h-11 items-center justify-center gap-2 rounded-md bg-cta px-5 text-[15px] font-semibold text-cta-ink transition-colors hover:bg-cta-hover ${className}`;
  if (link) {
    return (
      <a href={link} target="_blank" rel="noopener nofollow" className={base}>
        {t.product.goToStore}
        <ExternalLink size={16} aria-hidden="true" />
      </a>
    );
  }
  if (!offer.seller.phone) return null;
  return (
    <a href={telLink(offer.seller.phone)} className={base}>
      <Phone size={16} aria-hidden="true" />
      {t.seller.call}
    </a>
  );
}

function Option({ selected, muted = false, onClick, children }: { selected: boolean; muted?: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`flex min-h-11 flex-col items-start justify-center rounded-md border px-3.5 py-1.5 text-left transition-colors ${
        selected ? "border-brand bg-brand-soft ring-1 ring-brand" : muted ? "border-dashed border-line text-faint hover:border-dim" : "border-line bg-surface hover:border-dim"
      }`}
    >
      {children}
    </button>
  );
}

function VariantPicker({ variants, current, onPick, priceOf }: { variants: Variant[]; current: Variant; onPick: (id: string) => void; priceOf: (id: string) => number | null }) {
  const { t, lang } = useI18n();
  const axes = AXES.filter((axis) => variants.some((v) => v.attributes[axis]));
  const byAxes = axes.length > 0 && variants.every((v) => axes.some((axis) => v.attributes[axis]));

  if (!byAxes) {
    return (
      <fieldset className="flex flex-col">
        <legend className="mb-2.5 text-sm font-semibold text-ink">{t.product.variant}</legend>
        <div className="flex flex-wrap gap-2">
          {variants.map((v) => {
            const price = priceOf(v.id);
            return (
              <Option key={v.id} selected={v.id === current.id} onClick={() => onPick(v.id)}>
                <span className="text-sm font-semibold">{v.label}</span>
                {price && <span className="text-xs text-dim">{formatTaka(price, lang)}</span>}
              </Option>
            );
          })}
        </div>
      </fieldset>
    );
  }

  const match = (axis: Axis, value: string) =>
    variants.find((v) => v.attributes[axis] === value && axes.every((other) => other === axis || v.attributes[other] === current.attributes[other]));

  const valuesOf = (axis: Axis) => sortAxisValues(axis, [...new Set(variants.map((v) => v.attributes[axis]).filter((v): v is string => Boolean(v)))]);

  return (
    <div className="flex flex-col gap-4">
      {axes.map((axis) => {
        const values = valuesOf(axis);
        if (values.length === 0) return null;
        if (values.length === 1) {
          return (
            <fieldset key={axis} className="flex flex-col">
              <legend className="mb-2 text-sm text-dim">
                {t.axis[axis]}: <span className="font-semibold text-ink">{values[0]}</span>
              </legend>
              <div className="flex flex-wrap gap-2">
                <span className="flex min-h-11 items-center rounded-md border border-line bg-surface-2 px-3.5 text-sm font-semibold text-ink">{values[0]}</span>
              </div>
            </fieldset>
          );
        }
        return (
          <fieldset key={axis} className="flex flex-col">
            <legend className="mb-2 text-sm text-dim">
              {t.axis[axis]}: <span className="font-semibold text-ink">{current.attributes[axis] ?? "—"}</span>
            </legend>
            <div className="flex flex-wrap gap-2">
              {values.map((value) => {
                const exact = match(axis, value);
                const price = exact ? priceOf(exact.id) : null;
                return (
                  <Option
                    key={value}
                    selected={current.attributes[axis] === value}
                    muted={!exact}
                    onClick={() => onPick((exact ?? variants.find((v) => v.attributes[axis] === value))!.id)}
                  >
                    <span className="text-sm font-semibold">{value}</span>
                    <span className="text-xs text-dim">{exact ? (price ? formatTaka(price, lang) : "—") : t.product.unavailable}</span>
                  </Option>
                );
              })}
            </div>
          </fieldset>
        );
      })}
    </div>
  );
}

function SpecsPanel({ specs, source }: { specs: SpecGroup[]; source?: string | null }) {
  const { t } = useI18n();
  const rows = keySpecs(specs);
  return (
    <Panel title={t.product.specs} id="specs">
      {rows.length > 0 ? (
        <dl className="divide-y divide-line-soft text-sm">
          {rows.map((row) => (
            <div key={row.key} className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-4 px-5 py-3">
              <dt className="text-dim">{t.keySpec[row.key]}</dt>
              <dd className="font-medium text-ink">{row.value}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="px-5 py-4 text-sm text-dim">{t.product.specsMissing}</p>
      )}
      {specs.length > 0 && (
        <details className="group border-t border-line-soft text-sm">
          <summary className="flex cursor-pointer list-none items-center justify-center gap-1.5 px-5 py-3 font-semibold text-brand-text hover:bg-surface-2">
            {t.product.allSpecs}
            <ChevronDown size={16} className="transition-transform group-open:rotate-180" aria-hidden="true" />
          </summary>
          {specs.map((g) => (
            <section key={g.group}>
              <h3 className="border-y border-line-soft bg-surface-2 px-5 py-2 text-xs font-semibold tracking-wide text-dim uppercase">{g.group}</h3>
              <dl className="divide-y divide-line-soft">
                {g.items.map((item, i) => (
                  <div key={`${item.label}-${i}`} className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-4 px-5 py-2.5">
                    <dt className="text-dim">{item.label}</dt>
                    <dd className="break-words whitespace-pre-line text-ink">{item.value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </details>
      )}
      {source && (
        <p className="border-t border-line-soft px-5 py-3 text-xs text-dim">
          <a href={source} target="_blank" rel="noopener nofollow" className="hover:text-brand hover:underline">
            {t.product.specSource(hostOf(source))}
          </a>
        </p>
      )}
    </Panel>
  );
}

export function ProductView({ initial, regionNotes }: { initial: ProductDetail; regionNotes: RegionNote[] }) {
  const { lang, t, num, ago, prefix } = useI18n();
  const { product, offers, history, category, alternatives, startVariant } = initial;
  const { slugs, isSaved } = useSaved();
  const { name: categoryName, find } = useCategories();
  const info = category ?? find(product.category);
  const warranty = info?.warranty !== false;
  const kinds = categoryConditions(info);
  const categoryLabel = category ? (lang === "en" ? category.nameEn : category.name) : categoryName(product.category);
  const [pickedId, setPickedId] = useState<string | null>(null);
  // লিংকে ?v= ভার্সন পাঠালে (যেমন হোমের তুলনা কার্ড) সেই ভার্সনেই পাতা খোলে; ভুল/পুরনো id হলে আগেরটাতেই থাকে
  const urlVariant = useSyncExternalStore(neverChanges, readUrlVariant, () => null);
  const variantId =
    pickedId ??
    (urlVariant && product.variants.some((x) => x.id === urlVariant) ? urlVariant : startVariant ?? product.variants[0]?.id);
  const variant = product.variants.find((v) => v.id === variantId) ?? product.variants[0];
  const cheaper = alternatives[variant?.id ?? ""] ?? [];

  const variantOffers = offers.filter((o) => o.variantId === variant?.id);
  // একই শপ-লিংক একাধিক ভার্সনে থাকলে দোকানের পাতা নিজের ডিফল্ট (সাধারণত বেস) ভার্সনে খোলে — সতর্কবার্তা দেখাতে হয়
  const sharedLinks = new Set(
    [...offers.reduce((map, o) => {
      const link = o.url ?? o.seller.website;
      if (link) map.set(link, (map.get(link) ?? new Set<string>()).add(o.variantId));
      return map;
    }, new Map<string, Set<string>>())].filter(([, variantIds]) => variantIds.size > 1).map(([link]) => link)
  );
  // পাতা যেই ভার্সনে খোলে (সবচেয়ে কম দামের, দোকানগুলোও সাধারণত ওটাতেই ডিফল্ট) সেই সারিতে সতর্কবার্তা লাগে না; বাকিদের শপে কোন ভার্সন বাছতে হবে তা বলা হয়
  const variantHint =
    variant && variant.id !== (startVariant ?? product.variants[0]?.id)
      ? variant.label
      : null;
  const conditions = kinds.filter((c) => variantOffers.some((o) => o.condition === c));
  const [chosen, setChosen] = useState<Condition | "all">("all");
  const condition: Condition | "all" = chosen === "all" || conditions.includes(chosen) ? chosen : "all";
  const regions = [...new Set(variantOffers.map((o) => primaryRegion(o.region)).filter((r): r is string => Boolean(r)))].sort();
  const [regionChoice, setRegion] = useState<string | null>(null);
  const region = regionChoice && regions.includes(regionChoice) ? regionChoice : null;
  const regionNote = region ? regionNotes.find((n) => primaryRegion(n.region) === region) : undefined;
  const inView = (o: OfferView) => (region ? primaryRegion(o.region) === region : condition === "all" || o.condition === condition);
  const shown = variantOffers
    .filter(inView)
    .sort((a, b) => byStock(a, b) || a.price - b.price || (a.condition === b.condition ? 0 : a.condition === "official" ? -1 : b.condition === "official" ? 1 : 0));
  const best = shown[0];
  const samePriceCount = best ? shown.filter((o) => o.price === best.price).length : 0;
  const fullName = `${product.brand} ${product.name}`;

  const official = variant?.officialPrice ?? null;
  const reference = best ? Math.max(realOldPrice(neverCharged(best, history) ? null : best.oldPrice, official) ?? 0, best.condition === "official" || (!warranty && !isReplica(best.condition)) ? (official ?? 0) : 0) : 0;
  const off = best && reference > best.price ? Math.round(((reference - best.price) / reference) * 100) : 0;
  const variantLowest = (id: string) => {
    const matching = offers.filter((o) => o.variantId === id && inView(o));
    const available = matching.filter((o) => o.inStock !== false);
    const prices = (available.length ? available : matching).map((o) => o.price);
    return prices.length ? Math.min(...prices) : null;
  };

  const specs = product.specs ?? [];
  const highlights = specHighlights(specs);
  const colorIsVariant = product.variants.some((v) => v.attributes.color);
  const description = lang === "en" ? product.descriptionEn || product.description : product.description || product.descriptionEn;
  const variantName = variant ? AXES.filter((axis) => variant.attributes[axis]).map((axis) => `${t.axis[axis]} ${variant.attributes[axis]}`).join(", ") || variant.label : "";
  const needsNeir = product.category === "mobile" || /cellular|lte/i.test(variant?.attributes.connectivity ?? "");
  const lastChecked = shown.reduce((a, o) => (o.checkedAt > a ? o.checkedAt : a), best?.checkedAt ?? "");
  // গত ৩০ দিনে এই ভার্সনের সবচেয়ে কম দাম (বেক করা ইতিহাস ৩১ দিনের); এখনকার দামও ধরা
  const sections = [
    { id: "price", label: t.product.sections.price },
    ...(shown.length ? [{ id: "stores", label: t.product.sections.stores }] : []),
    ...(cheaper.length ? [{ id: "cheaper", label: t.product.sections.cheaper }] : []),
    { id: "specs", label: t.product.sections.specs },
    { id: "history", label: t.product.sections.history },
    ...(description ? [{ id: "about", label: t.product.sections.about }] : []),
  ];
  // স্টকে না থাকা দোকান বাদ, নইলে সস্তা দোকানের স্টক ফুরালে "আগে কম ছিল" মনে হয়
  const inStockShown = shown.filter((o) => o.inStock !== false);
  const chartOffers = inStockShown.length ? inStockShown : shown;
  const chartHistory = history.filter((p) => chartOffers.some((o) => o.id === p.offerId));
  const monthLow = Math.min(...chartHistory.map((p) => p.price), ...chartOffers.map((o) => o.price));
  const seen = chartHistory.map((p) => Date.parse(p.seenAt));
  const historyDays = seen.length ? (Math.max(...seen) - Math.min(...seen)) / 86400000 : 0;
  const atMonthLow = best != null && best.inStock !== false && historyDays >= 14 && best.price <= Math.min(...chartHistory.map((p) => p.price));

  return (
    <div className="flex flex-col gap-4 pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-0">
      <nav aria-label="breadcrumb" className="flex flex-wrap items-center gap-1 text-[13px] text-dim">
        <Link href={`${prefix}/`} className="hover:text-brand">
          {t.nav.home}
        </Link>
        <ChevronRight size={13} aria-hidden="true" />
        <Link href={categoryPath(prefix, product.category)} className="hover:text-brand">
          {categoryLabel}
        </Link>
        <ChevronRight size={13} aria-hidden="true" />
        <Link href={brandPath(prefix, product.brand)} className="hover:text-brand">
          {product.brand}
        </Link>
        <ChevronRight size={13} aria-hidden="true" />
        <span className="truncate text-ink">{product.name}</span>
      </nav>

      <SectionNav sections={sections} hero="price" />

      <div id="price" className="grid scroll-mt-32 grid-cols-[minmax(0,1fr)] gap-4 rounded-lg border border-line bg-surface p-4 md:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] md:gap-7 md:p-6">
        <ProductGallery key={variant?.attributes.color} product={product} start={imageFor(product.images ?? [], variant?.attributes.color)} />

        <div className="flex flex-col gap-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-col gap-1">
              <Link href={brandPath(prefix, product.brand)} className="text-xs font-semibold tracking-wider text-brand uppercase hover:underline">
                {product.brand}
              </Link>
              <h1 className="text-[20px] leading-tight font-semibold tracking-tight text-ink md:text-[24px]">{product.name}</h1>
            </div>
            <div className="flex shrink-0 gap-2">
              <ShareButton title={fullName} className="flex size-11 items-center justify-center rounded-md border border-line bg-surface text-dim hover:border-dim hover:text-ink" />
              <SaveButton slug={product.slug} />
            </div>
          </div>
          {isSaved(product.slug) && <PriceAlertToggle slugs={slugs} compact />}

          {highlights.length > 0 && (
            <ul className="grid gap-x-4 gap-y-1 text-[13px] text-ink sm:grid-cols-2">
              {highlights.map((h) => (
                <li key={h.key} className="flex min-w-0 items-start gap-2">
                  <Check size={15} className="mt-0.5 shrink-0 text-ok" aria-hidden="true" />
                  <span className="min-w-0 break-words">
                    <span className="text-dim">{t.keySpec[h.key]}: </span>
                    {h.value}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {best ? (
            <div className="flex flex-col gap-2 border-y border-line-soft py-4">
              <span className="text-[13px] font-medium text-dim">{t.product.lowestLabel}</span>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="text-[24px] leading-none font-bold tracking-tight text-ink md:text-[28px]">{formatTaka(best.price, lang)}</span>
                {off > 0 && (
                  <>
                    <span className="text-base text-faint line-through">{formatTaka(reference, lang)}</span>
                    <span className="rounded bg-sale-soft px-1.5 py-0.5 text-xs font-semibold text-sale">{t.product.off(num(off))}</span>
                  </>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                <SellerLogo seller={best.seller} size={22} />
                <span className="font-medium text-ink">{t.product.atStore(best.seller.name)}</span>
                {best.region && <span className="text-dim">({best.region})</span>}
                <VerifiedBadge verified={best.seller.verified} />
                {official && official !== reference && !isReplica(best.condition) && (
                  <span className="text-dim">
                    · {warranty ? t.product.officialShort : t.product.listPrice} {formatTaka(official, lang)}
                  </span>
                )}
              </div>
              {samePriceCount > 1 && <span className="text-[13px] font-medium text-ok">{t.product.samePriceMore(num(samePriceCount - 1))}</span>}
            </div>
          ) : (
            <EmptyState icon={Store} title={t.product.noOffers} />
          )}

          {variant && (product.variants.length > 1 || variantLabel(variant.attributes)) && <VariantPicker variants={product.variants} current={variant} onPick={setPickedId} priceOf={variantLowest} />}

          {conditions.length > 1 && (
            <fieldset className="flex flex-col">
              <legend className="mb-2 text-sm text-dim">{warranty ? t.product.condition : t.product.kind}</legend>
              <div className="inline-flex w-fit flex-wrap rounded-md border border-line bg-surface-2 p-1">
                {(["all", ...conditions] as const).map((c) => (
                  <button
                    key={c}
                    type="button"
                    aria-pressed={!region && c === condition}
                    onClick={() => {
                      setChosen(c);
                      setRegion(null);
                    }}
                    className={`h-9 rounded px-3.5 text-sm font-medium transition-colors ${!region && c === condition ? "bg-surface text-ink shadow-sm" : "text-dim hover:text-ink"}`}
                  >
                    {c === "all" ? t.search.all : conditionLabel(t, c, warranty)} <span className="text-faint">({num(c === "all" ? variantOffers.length : variantOffers.filter((o) => o.condition === c).length)})</span>
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          {regions.length > 0 && (
            <fieldset className="flex flex-col">
              <legend className="mb-2 flex items-center gap-1.5 text-sm text-dim">
                <Globe size={14} aria-hidden="true" />
                {t.product.region}
              </legend>
              <div className="flex flex-wrap gap-2">
                {[null, ...regions].map((r) => (
                  <button
                    key={r ?? "all"}
                    type="button"
                    aria-pressed={region === r}
                    onClick={() => setRegion(r)}
                    className={`h-9 rounded-full border px-3.5 text-sm font-medium transition-colors ${region === r ? "border-brand bg-brand-soft text-brand-text" : "border-line hover:border-dim"}`}
                  >
                    {r ?? t.product.allRegions} <span className="text-faint">({num(r ? variantOffers.filter((o) => primaryRegion(o.region) === r).length : variantOffers.length)})</span>
                  </button>
                ))}
              </div>
              {regionNote && (
                <p className="mt-2 rounded-md border border-brand/20 bg-brand-soft px-3.5 py-2.5 text-[13px] text-brand-text">
                  <strong>{region}: </strong>
                  {lang === "en" ? regionNote.noteEn || regionNote.note : regionNote.note}
                </p>
              )}
            </fieldset>
          )}

          {!colorIsVariant && (product.colors?.length ?? 0) > 0 && (
            <p className="text-sm text-dim">
              {t.product.colors}: <span className="text-ink">{product.colors!.join(", ")}</span>
            </p>
          )}

          {warranty && shown.some((o) => o.condition === "unofficial") && (
            <p className="rounded-md border border-gold/30 bg-gold-soft px-3.5 py-2.5 text-[13px] leading-relaxed text-gold-text">{needsNeir ? t.product.unofficialNeir : t.product.unofficialWarning}</p>
          )}

          {info?.verifyNote && <p className="rounded-md border border-gold/30 bg-gold-soft px-3.5 py-2.5 text-[13px] leading-relaxed text-gold-text">{t.product.verifyNote}</p>}
          {info?.qualityNote && <p className="rounded-md border border-gold/30 bg-gold-soft px-3.5 py-2.5 text-[13px] leading-relaxed text-gold-text">{t.product.qualityNote}</p>}

          {best && (
            <div className="flex flex-col gap-3">
              <div className="hidden gap-3 md:flex">
                <BuyButton offer={best} className="flex-1" />
                <a href="#stores" className="flex h-11 flex-1 items-center justify-center rounded-md border border-line bg-surface text-[15px] font-semibold text-ink transition-colors hover:border-dim">
                  {t.product.compare(num(shown.length))}
                </a>
              </div>
              {variantHint && sharedLinks.has(best.url ?? best.seller.website ?? "") && (
                <span className="flex items-start gap-1.5 text-[13px] font-medium text-gold-text">
                  <AlertTriangle size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
                  {t.product.checkVariant(variantHint)}
                </span>
              )}
              <span className="flex items-center gap-1.5 text-[13px] text-dim">
                <Clock size={14} aria-hidden="true" />
                {t.product.updated(ago(lastChecked))}
              </span>
              {atMonthLow && (
                <span className="flex items-center gap-1.5 text-[13px] font-medium text-ok">
                  <TrendingDown size={14} aria-hidden="true" />
                  {t.product.monthLowest}
                </span>
              )}
              {Number.isFinite(monthLow) && !atMonthLow && <span className="text-[13px] text-dim">{t.product.monthLow(formatTaka(monthLow, lang))}</span>}
            </div>
          )}
        </div>
      </div>

      <PageBanner page="product" />

      {shown.length > 0 && (
        <Panel title={t.product.allPrices} subtitle={product.variants.length > 1 ? variantName : undefined} id="stores">
          <OffersTable offers={shown} official={official} warranty={warranty} showCondition={kinds.length > 1} history={history} sharedLinks={sharedLinks} variantHint={variantHint} />
        </Panel>
      )}

      {cheaper.length > 0 && (
        <Panel title={t.product.cheaperTitle} subtitle={t.product.cheaperSub} id="cheaper">
          <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 md:grid-cols-4 md:p-5 lg:grid-cols-6">
            {cheaper.map((alternative) => (
              <AlternativeCard key={alternative.summary.product.id} alternative={alternative} />
            ))}
          </div>
        </Panel>
      )}

      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <SpecsPanel specs={specs} source={product.specsSource} />
        <Panel title={t.product.history} id="history">
          <div className="px-5 py-4">
            <PriceChart history={chartHistory} offers={chartOffers} />
          </div>
        </Panel>
      </div>

      {description && (
        <Panel title={t.product.about} id="about">
          <p className="px-5 py-4 text-[15px] leading-relaxed whitespace-pre-line text-ink">{description}</p>
        </Panel>
      )}

      <SubmitPriceDialog
        key={variant?.id}
        fixed={{ name: `${fullName} ${variant?.label ?? ""}`.trim(), productId: product.id, variantId: variant?.id }}
        trigger={(open) => (
          <button
            type="button"
            onClick={open}
            className="flex h-12 items-center justify-center gap-2 rounded-lg border border-dashed border-line bg-surface text-sm font-medium text-dim hover:border-dim hover:text-ink"
          >
            <Megaphone size={17} aria-hidden="true" />
            {t.product.reportCta}
          </button>
        )}
      />

      {best && (
        <div className="fixed inset-x-0 bottom-[calc(4rem+1px+env(safe-area-inset-bottom))] z-30 flex items-center gap-3 border-t border-line bg-surface px-4 py-2.5 shadow-[0_-4px_12px_rgb(0_0_0/0.06)] md:hidden">
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="text-lg leading-tight font-bold text-ink">{formatTaka(best.price, lang)}</span>
            <span className="truncate text-xs text-dim">{t.product.atStore(best.seller.name)}</span>
          </span>
          <BuyButton offer={best} className="h-11 px-5" />
        </div>
      )}
    </div>
  );
}
