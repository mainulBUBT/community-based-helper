import { hasBackend, supabaseFetch } from "@/lib/supabase-rest";
import type { CategoryInfo, Offer, PricePoint, Product, ProductSummary, Promo, Seller } from "@/types/catalog";
import type { SiteSettings } from "@/types/admin";

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

export const SUMMARIES_URL = `${BASE}/summaries.json`;

let summariesP: Promise<ProductSummary[]> | null = null;

// ব্রাউজারে শুধু কার্ডের তথ্য লাগে (খোঁজা, সাজেশন, সেভ, মেনু); পুরো ক্যাটালগের প্রায় দশ ভাগের এক ভাগ
export function listSummaries(): Promise<ProductSummary[]> {
  summariesP ??= fetch(SUMMARIES_URL)
    .then((response) => {
      if (!response.ok) throw new Error(`summaries.json: ${response.status}`);
      return response.json() as Promise<ProductSummary[]>;
    })
    .catch((error) => {
      summariesP = null;
      throw error;
    });
  return summariesP;
}

export type SubmitError = "limit" | "captcha" | "failed";

// জমা হয় Edge Function দিয়ে: সেখানে Turnstile যাচাই, ঘরগুলো ছাঁকা, তারপর IP ধরে সীমা (supabase/functions/submit-price)
export async function submitPrice(payload: Record<string, string>, token: string | null): Promise<SubmitError | null> {
  if (!hasBackend) return null;
  const res = await supabaseFetch("/functions/v1/submit-price", { method: "POST", body: JSON.stringify({ payload, token }) });
  if (res.ok) return null;
  return res.status === 429 ? "limit" : res.status === 403 ? "captcha" : "failed";
}
