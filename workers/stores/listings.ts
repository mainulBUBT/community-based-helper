import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { CatalogProduct } from "../lib/match";
import type { Listing, Store } from "./types";

const DIR = ".cache/listings";
const MAX_AGE_MS = 26 * 3600_000;

type Product = Pick<CatalogProduct, "name" | "brand">;

interface Saved {
  fetchedAt: string;
  brands: string[];
  listings: Listing[];
}

const brandsOf = (products: Product[]) => [...new Set(products.map((p) => p.brand.toLowerCase()))];

async function load(store: Store): Promise<Saved | null> {
  try {
    return JSON.parse(await readFile(join(DIR, `${store.id}.json`), "utf8")) as Saved;
  } catch {
    return null;
  }
}

function usable(saved: Saved | null, store: Store, targets: Product[]): saved is Saved {
  if (!saved || Date.now() - Date.parse(saved.fetchedAt) > MAX_AGE_MS) return false;
  return store.listsBy !== "brand" || brandsOf(targets).every((brand) => saved.brands.includes(brand));
}

// রাতের run এ দোকানের পুরো তালিকা নতুন করে আনা হয়; মাঝের run (নতুন পণ্য) জমা তালিকা থেকে মেলায়
export async function storeListings(store: Store, targets: Product[], catalog: Product[], refresh: boolean): Promise<Listing[]> {
  if (store.listsBy === "name") return store.discover(targets);
  const saved = refresh ? null : await load(store);
  if (usable(saved, store, targets)) return saved.listings;
  const listings = await store.discover(catalog);
  await mkdir(DIR, { recursive: true });
  await writeFile(join(DIR, `${store.id}.json`), JSON.stringify({ fetchedAt: new Date().toISOString(), brands: brandsOf(catalog), listings } satisfies Saved));
  return listings;
}
