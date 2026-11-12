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

// পড়া পাতা আর কোন run (ক্যাটালগ আনার সময়) পড়েছিল; ধীর দোকান পরের run এ সেখান থেকে এগোয়
const handledFile = (store: Store) => join(DIR, `${store.id}.done.json`);

export async function handledListings(store: Store): Promise<Map<string, string>> {
  try {
    return new Map(Object.entries(JSON.parse(await readFile(handledFile(store), "utf8")) as Record<string, string>));
  } catch {
    return new Map();
  }
}

let saving = Promise.resolve();

// job timeout এ মারা গেলেও আগের পড়া থাকে, তাই প্রতিটা পাতার পরে; একসাথে দুটো লেখা যাতে ফাইল না ভাঙে, তাই সারি।
// লেখা না গেলে শুধু পরের বার পাতাটা আবার পড়া হয়
export function saveHandled(store: Store, handled: Map<string, string>): Promise<void> {
  saving = saving
    .then(async () => {
      await mkdir(DIR, { recursive: true });
      await writeFile(handledFile(store), JSON.stringify(Object.fromEntries(handled)));
    })
    .catch(() => undefined);
  return saving;
}

// রাতের run এ দোকানের পুরো তালিকা নতুন করে আনা হয়; মাঝের run (নতুন পণ্য) জমা তালিকা থেকে মেলায়
export async function storeListings(store: Store, targets: Product[], catalog: Product[], refresh: boolean): Promise<Listing[]> {
  const saved = refresh ? null : await load(store);
  if (usable(saved, store, targets)) return saved.listings;
  const listings = await store.discover(catalog);
  await mkdir(DIR, { recursive: true });
  await writeFile(join(DIR, `${store.id}.json`), JSON.stringify({ fetchedAt: new Date().toISOString(), brands: brandsOf(catalog), listings } satisfies Saved));
  return listings;
}
