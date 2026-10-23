import { DEFAULT_SETTINGS } from "@/config/site";
import { supabase } from "@/lib/supabase";
import type { SiteSettings } from "@/types/admin";
import type { PricePoint } from "@/types/catalog";
import { makeService, type Catalog } from "./catalog-core";
import { toCategory, toOffer, toPricePoint, toProduct, toPromo, toSeller } from "./mappers";
import { sampleCategories, sampleHistory, sampleOffers, sampleProducts, samplePromos, sampleSellers } from "@/data/sample";
import { safeUrl } from "@/utils/url";

// অ্যাডমিন প্যানেল লাইভ Supabase পড়ে — সাইট build-time বেক করা ডেটায় চলে (catalog.ts)।
async function fetchCatalog(): Promise<Catalog> {
  if (!supabase) {
    // Supabase যুক্ত না থাকলে নমুনা ডেটায় (ডেমো মোড)।
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
    offers: (offers.data ?? []).map(toOffer).filter((o) => o.published),
    promos: (promos.data ?? []).map(toPromo),
  };
}

async function loadHistory(offerIds: string[]): Promise<PricePoint[]> {
  if (!supabase) return sampleHistory.filter((p) => offerIds.includes(p.offerId));
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
