import { readFile } from "node:fs/promises";
import path from "node:path";
import { DEFAULT_SETTINGS } from "@/config/site";
import type { SiteSettings } from "@/types/admin";
import { safeUrl } from "@/utils/url";
import { makeService, type Catalog } from "./catalog-core";
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

export const { loadCatalog, listSummaries, listCategories, listSellers, getProductDetail, getSellerDetail } = makeService(
  fetchCatalog,
  loadHistory,
);
