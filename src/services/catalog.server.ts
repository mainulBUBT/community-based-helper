import { readFile } from "node:fs/promises";
import path from "node:path";
import { BUDGET_MIN_PRODUCTS, BUDGETS } from "@/config/budgets";
import { DEFAULT_SETTINGS } from "@/config/site";
import type { SiteSettings } from "@/types/admin";
import { byStock, toCard } from "@/utils/catalog";
import { categoryFamily } from "@/utils/categories";
import { brandSlug } from "@/utils/url";
import { safeUrl } from "@/utils/url";
import { makeService, type Catalog, type HomeData } from "./catalog-core";
import type { BakedChunk, BakedManifest } from "./catalog";

// build এর সময় সার্ভার-সাইড পেজগুলো একই বেক করা ফাইল সরাসরি ডিস্ক থেকে পড়ে।
const DIR = path.join(process.cwd(), "public", "data", "catalog");

const read = async <T>(name: string): Promise<T> => JSON.parse(await readFile(path.join(DIR, name), "utf8")) as T;

let manifestP: Promise<BakedManifest> | null = null;
let chunksP: Promise<BakedChunk[]> | null = null;

const manifest = () => (manifestP ??= read<BakedManifest>("manifest.json"));

async function fetchCatalog(): Promise<Catalog> {
  const m = await manifest();
  chunksP ??= Promise.all(m.categories.map((c) => read<BakedChunk>(`${c.slug}.json`)));
  const baked = await chunksP;
  return {
    categories: m.categories,
    sellers: m.sellers,
    promos: m.promos,
    products: baked.flatMap((c) => c.products),
    offers: baked.flatMap((c) => c.offers),
  };
}

async function loadHistory(offerIds: string[]) {
  const byId = new Set(offerIds);
  const baked = (await chunksP) ?? [];
  return baked.flatMap((c) => c.history.filter((p) => byId.has(p.offerId)));
}

export async function getSiteSettings(): Promise<SiteSettings> {
  const { settings } = await manifest();
  return {
    ...DEFAULT_SETTINGS,
    ...settings,
    logoUrl: safeUrl(settings.logoUrl),
    facebook: safeUrl(settings.facebook),
    announcementLink: safeUrl(settings.announcementLink, { relative: true }),
  };
}

export const { loadCatalog, listSummaries, listCategories, listSellers, listComparisons, getProductDetail, getSellerDetail } = makeService(
  fetchCatalog,
  loadHistory,
);

export async function getHomeData(): Promise<HomeData> {
  const [summaries, sellers, settings, comparisons] = await Promise.all([listSummaries(), listSellers(), getSiteSettings(), listComparisons()]);
  return { summaries: summaries.map(toCard), sellers, settings, comparisons };
}

// ক্যাটাগরি পেজের স্ট্যাটিক HTML আর প্রথম রেন্ডারের জন্য: ভেতরের ভাগসহ, জনপ্রিয়তা অনুযায়ী
export async function getCategoryPage(slug: string) {
  const [categories, summaries] = await Promise.all([listCategories(), listSummaries()]);
  const category = categories.find((c) => c.slug === slug);
  if (!category) return null;
  const family = new Set(categoryFamily(categories, slug));
  const items = summaries.filter((s) => family.has(s.product.category)).sort((a, b) => byStock(a, b) || b.product.popularity - a.product.popularity);
  return { category, summaries: items.map(toCard) };
}

// বাজেটের পাতা: স্টকে থাকা, দাম বাজেটের মধ্যে; ক্রম ক্যাটাগরি পাতার মতো (লোকে বেশি খোঁজা আগে)
export async function getBudgetPage(slug: string, budget: number) {
  const page = await getCategoryPage(slug);
  if (!page || !BUDGETS[slug]?.includes(budget)) return null;
  const summaries = page.summaries.filter((s) => s.inStock && s.lowest && s.lowest <= budget);
  return summaries.length >= BUDGET_MIN_PRODUCTS ? { category: page.category, budget, summaries } : null;
}

// যে বাজেটে যথেষ্ট পণ্য আছে শুধু সেগুলো; ক্যাটাগরি পাতার লিংক, sitemap আর static পাতা এখান থেকে
export async function listBudgets(slug?: string) {
  const pages = await Promise.all(
    Object.entries(BUDGETS)
      .filter(([category]) => !slug || category === slug)
      .flatMap(([category, amounts]) => amounts.map((amount) => getBudgetPage(category, amount))),
  );
  return pages.filter((p) => p !== null).map((p) => ({ slug: p.category.slug, budget: p.budget, count: p.summaries.length }));
}

// ব্র্যান্ড পেজ: সব ব্র্যান্ডের পেজ হয়, তবে ২টার কম পণ্য হলে Google এ তোলা হয় না (পাতলা পেজ)
export const BRAND_MIN_PRODUCTS = 2;

export async function listBrands() {
  const summaries = await listSummaries();
  const brands = new Map<string, { slug: string; name: string; count: number }>();
  for (const { product } of summaries) {
    const slug = brandSlug(product.brand);
    const entry = brands.get(slug) ?? { slug, name: product.brand, count: 0 };
    entry.count++;
    brands.set(slug, entry);
  }
  return [...brands.values()];
}

export async function getBrandPage(slug: string) {
  const [summaries, categories] = await Promise.all([listSummaries(), listCategories()]);
  const items = summaries.filter((s) => brandSlug(s.product.brand) === slug).sort((a, b) => byStock(a, b) || b.product.popularity - a.product.popularity);
  if (!items.length) return null;
  const used = new Set(items.map((s) => s.product.category));
  return { brand: items[0].product.brand, summaries: items.map(toCard), categories: categories.filter((c) => used.has(c.slug)) };
}
