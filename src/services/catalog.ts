import { DEFAULT_SETTINGS } from "@/config/site";
import { hasBackend, supabaseFetch } from "@/lib/supabase-rest";
import type { CategoryInfo, Offer, PricePoint, Product, Promo, Seller } from "@/types/catalog";
import type { SiteSettings } from "@/types/admin";
import { makeService, type Catalog } from "./catalog-core";
import { safeUrl } from "@/utils/url";

// সাইট build এর সময় বেক হওয়া ডেটা পড়ে (scripts/build-data.ts) — ভিজিটরের ডেটা Supabase থেকে আসে না।
const BASE = "/data/catalog";

export interface BakedManifest {
  generatedAt: string;
  categories: CategoryInfo[];
  sellers: Seller[];
  promos: Promo[];
  settings: Partial<SiteSettings>;
}

export interface BakedChunk {
  products: Product[];
  offers: Offer[];
  history: PricePoint[];
}

let manifestP: Promise<BakedManifest> | null = null;
let chunksP: Promise<BakedChunk[]> | null = null;

const file = (name: string, fresh: boolean) => `${BASE}/${name}${fresh ? `?t=${Date.now()}` : ""}`;

async function json<T>(name: string, fresh = false): Promise<T> {
  const response = await fetch(file(name, fresh));
  if (!response.ok) throw new Error(`${name}: ${response.status}`);
  return response.json() as Promise<T>;
}

function manifest(fresh = false) {
  manifestP ??= json<BakedManifest>("manifest.json", fresh).catch((error) => {
    manifestP = null;
    throw error;
  });
  return manifestP;
}

async function fetchCatalog(fresh = false): Promise<Catalog> {
  if (fresh) {
    manifestP = null;
    chunksP = null;
  }
  const m = await manifest(fresh);
  chunksP ??= Promise.all(m.categories.map((c) => json<BakedChunk>(`${c.slug}.json`, fresh))).catch((error) => {
    chunksP = null;
    throw error;
  });
  const baked = await chunksP;
  return {
    categories: m.categories,
    sellers: m.sellers,
    promos: m.promos,
    products: baked.flatMap((c) => c.products),
    offers: baked.flatMap((c) => c.offers),
  };
}

async function loadHistory(offerIds: string[]): Promise<PricePoint[]> {
  const byId = new Set(offerIds);
  const baked = (await chunksP) ?? [];
  return baked.flatMap((c) => c.history.filter((p) => byId.has(p.offerId)));
}

export async function getSiteSettings(): Promise<SiteSettings> {
  const m = await manifest();
  return {
    ...DEFAULT_SETTINGS,
    ...m.settings,
    logoUrl: safeUrl(m.settings.logoUrl),
    facebook: safeUrl(m.settings.facebook),
    announcementLink: safeUrl(m.settings.announcementLink, { relative: true }),
  };
}

export type SubmitError = "limit" | "captcha" | "failed";

// জমা হয় Edge Function দিয়ে: সেখানে Turnstile যাচাই, ঘরগুলো ছাঁকা, তারপর IP ধরে সীমা (supabase/functions/submit-price)
export async function submitPrice(payload: Record<string, string>, token: string | null): Promise<SubmitError | null> {
  if (!hasBackend) return null;
  const res = await supabaseFetch("/functions/v1/submit-price", { method: "POST", body: JSON.stringify({ payload, token }) });
  if (res.ok) return null;
  return res.status === 429 ? "limit" : res.status === 403 ? "captcha" : "failed";
}

export const { loadCatalog, listSummaries, listCategories, listSellers, listComparisons, getProductDetail, getSellerDetail } = makeService(
  fetchCatalog,
  loadHistory,
);
