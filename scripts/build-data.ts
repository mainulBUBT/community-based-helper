// build এর আগে Supabase থেকে পুরো ক্যাটালগ এনে public/data/catalog/ এ বেক করে।
// সাইট তখন ভিজিটরের ডেটা CDN থেকে দেয়, Supabase এ egress হয় না।
// Supabase যুক্ত না থাকলে নমুনা ডেটা বেক হয় (ডেমো মোড)।
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { DEFAULT_SETTINGS } from "../src/config/site";
import { toCategory, toOffer, toPricePoint, toProduct, toPromo, toSeller } from "../src/services/mappers";
import { safeUrl } from "../src/utils/url";
import type { SiteSettings } from "../src/types/admin";
import type { CategoryInfo, Offer, PricePoint, Product, Promo, Seller } from "../src/types/catalog";

const OUT = path.join(process.cwd(), "public", "data", "catalog");
const SINCE = new Date(Date.now() - 31 * 86400000).toISOString();

// Supabase একবারে ১০০০ সারির বেশি দেয় না
async function all<T>(run: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await run(from, from + 999);
    if (error) throw error;
    const batch = data ?? [];
    rows.push(...batch);
    if (batch.length < 1000) return rows;
  }
}

interface Raw {
  categories: CategoryInfo[];
  products: Product[];
  sellers: Seller[];
  offers: Offer[];
  promos: Promo[];
  history: PricePoint[];
  settings: SiteSettings;
}

async function fromSupabase(db: SupabaseClient): Promise<Raw> {
  const [categories, productRows, sellers, offerRows, promos, historyRows, settingsRow] = await Promise.all([
    all((from, to) => db.from("categories").select("*").order("position").range(from, to)),
    all((from, to) => db.from("products").select("*, variants(*)").order("popularity", { ascending: false }).range(from, to)),
    all((from, to) => db.from("sellers").select("*").range(from, to)),
    all((from, to) => db.from("offers").select("*").range(from, to)),
    all((from, to) => db.from("promos").select("*").range(from, to)),
    all((from, to) => db.from("price_history").select("*").gte("seen_at", SINCE).range(from, to)),
    db.from("site_settings").select("value").maybeSingle(),
  ]);
  if (settingsRow.error) throw settingsRow.error;
  return {
    categories: categories.map(toCategory),
    products: productRows.map(toProduct),
    sellers: sellers.map(toSeller),
    offers: offerRows.map(toOffer).filter((o) => o.published),
    promos: promos.map(toPromo),
    history: historyRows.map(toPricePoint),
    settings: {
      ...DEFAULT_SETTINGS,
      ...((settingsRow.data?.value as Partial<SiteSettings> | undefined) ?? {}),
    },
  };
}

async function fromSample(): Promise<Raw> {
  const s = await import("../src/data/sample");
  return {
    categories: s.sampleCategories,
    products: s.sampleProducts,
    sellers: s.sampleSellers,
    offers: s.sampleOffers.filter((o) => o.published),
    promos: s.samplePromos,
    history: s.sampleHistory,
    settings: { ...s.sampleSettings },
  };
}

async function main() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const live = Boolean(url && key);
  if (!live) console.warn("⚠️  Supabase যুক্ত নেই — নমুনা ডেটায় বেক হচ্ছে, লাইভ নয়! (.env.local এ NEXT_PUBLIC_SUPABASE_URL আর PUBLISHABLE_KEY দিন)");
  const raw = live ? await fromSupabase(createClient(url!, key!, { auth: { persistSession: false } })) : await fromSample();

  // ভ্যারিয়েন্ট আর অফারকে পণ্যের ভাগ অনুযায়ী ফাইলে ভাগ করা — বড় ক্যাটালগে এক ফাইল হালকা থাকে
  const variantCategory = new Map<string, string>();
  const offerCategory = new Map<string, string>();
  for (const product of raw.products) {
    for (const variant of product.variants) variantCategory.set(variant.id, product.category);
  }
  for (const offer of raw.offers) {
    const category = variantCategory.get(offer.variantId);
    if (category) offerCategory.set(offer.id, category);
  }
  interface Chunk {
    products: Product[];
    offers: Offer[];
    history: PricePoint[];
  }
  const chunks = new Map<string, Chunk>();
  const chunk = (slug: string) => {
    let list = chunks.get(slug);
    if (!list) chunks.set(slug, (list = { products: [], offers: [], history: [] }));
    return list;
  };
  for (const category of raw.categories) chunk(category.slug);
  for (const product of raw.products) chunk(product.category).products.push(product);
  for (const offer of raw.offers) {
    const category = offerCategory.get(offer.id);
    if (category) chunk(category).offers.push(offer);
  }
  for (const point of raw.history) {
    const category = offerCategory.get(point.offerId);
    if (category) chunk(category).history.push(point);
  }

  const settings: SiteSettings = {
    ...raw.settings,
    logoUrl: safeUrl(raw.settings.logoUrl),
    facebook: safeUrl(raw.settings.facebook),
    announcementLink: safeUrl(raw.settings.announcementLink, { relative: true }),
  };

  await mkdir(OUT, { recursive: true });
  await writeFile(
    path.join(OUT, "manifest.json"),
    JSON.stringify({ generatedAt: new Date().toISOString(), categories: raw.categories, sellers: raw.sellers, promos: raw.promos, settings }),
  );
  for (const [slug, data] of chunks) {
    await writeFile(path.join(OUT, `${slug}.json`), JSON.stringify(data));
  }
  const offers = raw.offers.length;
  console.log(`${live ? "লাইভ Supabase" : "নমুনা ডেটা"} থেকে বেক হলো: ${raw.products.length} পণ্য, ${offers} দাম, ${chunks.size} ভাগ → public/data/catalog/`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
