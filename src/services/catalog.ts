import { DEFAULT_SETTINGS } from "@/config/site";
import { sampleHistory, sampleOffers, sampleProducts, samplePromos, sampleSellers, sampleSettings, sampleCategories } from "@/data/sample";
import { supabase } from "@/lib/supabase";
import type { SiteSettings } from "@/types/admin";
import type { Alternative, CategoryInfo, Offer, OfferView, PricePoint, Product, ProductDetail, ProductSummary, Promo, Seller } from "@/types/catalog";
import { findCheaperAlternatives } from "@/utils/alternatives";
import { byPrice } from "@/utils/catalog";
import { toCategory, toOffer, toPricePoint, toProduct, toPromo, toSeller } from "./mappers";
import { safeUrl } from "@/utils/url";

interface Catalog {
  categories: CategoryInfo[];
  products: Product[];
  sellers: Seller[];
  offers: Offer[];
  promos: Promo[];
}

async function fetchCatalog(): Promise<Catalog> {
  if (!supabase) {
    return {
      categories: sampleCategories.filter((c) => c.active),
      products: sampleProducts,
      sellers: sampleSellers.filter((s) => s.active),
      offers: sampleOffers.filter((o) => o.published),
      promos: samplePromos.filter((p) => p.active),
    };
  }
  const [categories, products, sellers, offers, promos] = await Promise.all([
    supabase.from("categories").select("*").order("position"),
    supabase.from("products").select("*, variants(*)").order("popularity", { ascending: false }),
    supabase.from("sellers").select("*"),
    supabase.from("offers").select("*"),
    supabase.from("promos").select("*"),
  ]);
  const error = categories.error ?? products.error ?? sellers.error ?? offers.error ?? promos.error;
  if (error) throw error;
  return {
    categories: (categories.data ?? []).map(toCategory).filter((c) => c.active),
    products: (products.data ?? []).map(toProduct),
    sellers: (sellers.data ?? []).map(toSeller),
    offers: (offers.data ?? []).map(toOffer),
    promos: (promos.data ?? []).map(toPromo),
  };
}

let cache: Promise<Catalog> | null = null;

export function loadCatalog(fresh = false) {
  if (!cache || fresh) cache = fetchCatalog().catch((error) => ((cache = null), Promise.reject(error)));
  return cache;
}

function viewOffers(catalog: Catalog, offers: Offer[]): OfferView[] {
  const sellers = new Map(catalog.sellers.map((s) => [s.id, s]));
  return offers
    .filter((offer) => sellers.has(offer.sellerId))
    .map((offer) => ({
      ...offer,
      seller: sellers.get(offer.sellerId)!,
      promos: catalog.promos.filter((p) => p.sellerId === offer.sellerId),
    }))
    .sort(byPrice);
}

function summarize(catalog: Catalog, product: Product): ProductSummary {
  const variantIds = new Set(product.variants.map((v) => v.id));
  const offers = catalog.offers.filter((o) => variantIds.has(o.variantId));
  const official = offers.filter((o) => o.condition === "official");
  const priced = official.length ? official : offers;
  const best = priced.length ? priced.reduce((a, b) => (b.price < a.price ? b : a)) : null;
  const lowest = best?.price ?? null;
  const listPrice = best ? product.variants.find((v) => v.id === best.variantId)?.officialPrice : null;
  const reference = Math.max(best?.oldPrice ?? 0, listPrice ?? 0);
  const compareAt = lowest && reference > lowest ? reference : null;
  return {
    product,
    lowest,
    lowestAny: offers.length ? Math.min(...offers.map((o) => o.price)) : null,
    compareAt,
    inStock: offers.some((o) => o.inStock !== false),
    sellerCount: new Set(offers.map((o) => o.sellerId)).size,
    drop: compareAt && lowest ? compareAt - lowest : null,
  };
}

export async function listSummaries(includeHidden = false) {
  const catalog = await loadCatalog();
  const visible = new Set(catalog.categories.map((c) => c.slug));
  return catalog.products.filter((p) => includeHidden || visible.has(p.category)).map((product) => summarize(catalog, product));
}

export async function listCategories() {
  const catalog = await loadCatalog();
  return catalog.categories;
}

export async function listSellers() {
  const catalog = await loadCatalog();
  return catalog.sellers;
}

async function loadHistory(offerIds: string[]): Promise<PricePoint[]> {
  if (!supabase) return sampleHistory.filter((p) => offerIds.includes(p.offerId));
  const since = new Date(Date.now() - 31 * 86400000).toISOString();
  const { data, error } = await supabase.from("price_history").select("*").in("offer_id", offerIds).gte("seen_at", since);
  if (error) throw error;
  return data.map(toPricePoint);
}

function buildAlternatives(catalog: Catalog, product: Product, category: CategoryInfo | null): Record<string, Alternative[]> {
  const axes = category?.axes ?? [];
  const offersByVariant = new Map<string, Offer[]>();
  for (const offer of catalog.offers) {
    const list = offersByVariant.get(offer.variantId);
    if (list) list.push(offer);
    else offersByVariant.set(offer.variantId, [offer]);
  }
  const candidates = catalog.products
    .filter((p) => p.category === product.category && p.id !== product.id)
    .map((p) => ({
      product: p,
      summary: summarize(catalog, p),
      offers: p.variants.flatMap((v) => offersByVariant.get(v.id) ?? []),
    }));
  const result: Record<string, Alternative[]> = {};
  for (const variant of product.variants) {
    result[variant.id] = findCheaperAlternatives({
      current: product,
      currentVariant: variant,
      currentOffers: offersByVariant.get(variant.id) ?? [],
      candidates,
      axes,
    });
  }
  return result;
}

export async function getProductDetail(slug: string): Promise<ProductDetail | null> {
  const catalog = await loadCatalog();
  const product = catalog.products.find((p) => p.slug === slug);
  if (!product) return null;
  const variantIds = new Set(product.variants.map((v) => v.id));
  const offers = viewOffers(catalog, catalog.offers.filter((o) => variantIds.has(o.variantId)));
  const category = catalog.categories.find((c) => c.slug === product.category) ?? null;
  const alternatives = buildAlternatives(catalog, product, category);
  return { product, category, offers, history: await loadHistory(offers.map((o) => o.id)), alternatives };
}

export async function getSellerDetail(id: string) {
  const catalog = await loadCatalog();
  const seller = catalog.sellers.find((s) => s.id === id);
  if (!seller) return null;
  const variants = new Map(catalog.products.flatMap((p) => p.variants.map((v) => [v.id, { product: p, variant: v }] as const)));
  const listings = catalog.offers
    .filter((o) => o.sellerId === id && variants.has(o.variantId))
    .map((offer) => ({ offer, ...variants.get(offer.variantId)! }))
    .sort((a, b) => b.product.popularity - a.product.popularity);
  return { seller, listings, promos: catalog.promos.filter((p) => p.sellerId === id) };
}

export async function getSiteSettings(): Promise<SiteSettings> {
  if (!supabase) return { ...sampleSettings };
  const { data } = await supabase.from("site_settings").select("value").maybeSingle();
  const settings: SiteSettings = { ...DEFAULT_SETTINGS, ...(data?.value as Partial<SiteSettings> | undefined) };
  return {
    ...settings,
    logoUrl: safeUrl(settings.logoUrl),
    facebook: safeUrl(settings.facebook),
    announcementLink: safeUrl(settings.announcementLink, { relative: true }),
  };
}

export async function submitPrice(payload: Record<string, string>) {
  if (!supabase) return;
  const { error } = await supabase.from("review_queue").insert({ kind: "submission", payload });
  if (error) throw error;
}
