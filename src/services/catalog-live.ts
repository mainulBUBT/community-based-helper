import { DEFAULT_SETTINGS } from "@/config/site";
import { supabase } from "@/lib/supabase";
import type { SiteSettings } from "@/types/admin";
import type { PricePoint } from "@/types/catalog";
import { makeService, type Catalog } from "./catalog-core";
import { toCategory, toOffer, toPricePoint, toProduct, toPromo, toSeller } from "./mappers";
import { loadSampleCatalog, sampleCategories, samplePromos } from "@/data/sample";
import { safeUrl } from "@/utils/url";

const ROW_LIMIT = 1000;

// Supabase এক ডাকে ১০০০ সারির বেশি দেয় না
async function allRows<T>(page: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown; count: number | null }>): Promise<T[]> {
  const first = await page(0, ROW_LIMIT - 1);
  const pages = Math.ceil((first.count ?? 0) / ROW_LIMIT);
  const rest = await Promise.all(Array.from({ length: pages - 1 }, (_, i) => page((i + 1) * ROW_LIMIT, (i + 2) * ROW_LIMIT - 1)));
  return [first, ...rest].flatMap(({ data, error }) => {
    if (error) throw error;
    return data ?? [];
  });
}

// অ্যাডমিন প্যানেল লাইভ Supabase পড়ে — সাইট build-time বেক করা ডেটায় চলে (catalog.ts)।
async function fetchCatalog(): Promise<Catalog> {
  if (!supabase) {
    // Supabase যুক্ত না থাকলে নমুনা ডেটায় (ডেমো মোড)।
    const { sampleOffers, sampleProducts, sampleSellers } = await loadSampleCatalog();
    return {
      categories: sampleCategories.filter((c) => c.active),
      products: sampleProducts,
      sellers: sampleSellers.filter((s) => s.active),
      offers: sampleOffers.filter((o) => o.published),
      promos: samplePromos.filter((p) => p.active),
    };
  }
  const client = supabase;
  const [categories, products, sellers, offers, promos] = await Promise.all([
    client.from("categories").select("*").order("position"),
    allRows((from, to) => client.from("products").select("*, variants(*)", { count: "exact" }).order("popularity", { ascending: false }).order("id").range(from, to)),
    client.from("sellers").select("*"),
    allRows((from, to) => client.from("offers").select("*", { count: "exact" }).eq("published", true).order("id").range(from, to)),
    client.from("promos").select("*"),
  ]);
  const error = categories.error ?? sellers.error ?? promos.error;
  if (error) throw error;
  return {
    categories: (categories.data ?? []).map(toCategory).filter((c) => c.active),
    products: products.map(toProduct),
    sellers: (sellers.data ?? []).map(toSeller),
    offers: offers.map(toOffer),
    promos: (promos.data ?? []).map(toPromo),
  };
}

async function loadHistory(offerIds: string[]): Promise<PricePoint[]> {
  if (!supabase) return (await loadSampleCatalog()).sampleHistory.filter((p) => offerIds.includes(p.offerId));
  const since = new Date(Date.now() - 31 * 86400000).toISOString();
  const { data, error } = await supabase.from("price_history").select("*").in("offer_id", offerIds).gte("seen_at", since);
  if (error) throw error;
  return (data ?? []).map(toPricePoint);
}

export async function getSiteSettings(): Promise<SiteSettings> {
  if (!supabase) return { ...DEFAULT_SETTINGS };
  const { data } = await supabase.from("site_settings").select("value").maybeSingle();
  const settings: SiteSettings = { ...DEFAULT_SETTINGS, ...(data?.value as Partial<SiteSettings> | undefined) };
  return {
    ...settings,
    logoUrl: safeUrl(settings.logoUrl),
    facebook: safeUrl(settings.facebook),
    announcementLink: safeUrl(settings.announcementLink, { relative: true }),
  };
}

let cache: Promise<Catalog> | null = null;

export function loadCatalog(fresh = false) {
  if (!cache || fresh) cache = fetchCatalog().catch((error) => ((cache = null), Promise.reject(error)));
  return cache;
}

export const { listSummaries, listCategories, listSellers, getProductDetail, getSellerDetail } = makeService(loadCatalog, loadHistory);
