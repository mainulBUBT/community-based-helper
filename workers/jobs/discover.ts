import { bn } from "../lib/bn";
import { Disallowed, NotFound, StoreBlocked, message } from "../lib/errors";
import { judge } from "../lib/judge";
import { findProducts, sameSpec, type CatalogProduct, type CatalogVariant } from "../lib/match";
import { pool } from "../lib/pool";
import { place, single, type PageOffer } from "../lib/variants";
import { loadCatalog, markDiscovered } from "../services/catalog";
import { offerSlots, saveProductImage, slot, upsertOffer, variantPrices } from "../services/offers";
import { enqueue, reviewedUrls } from "../services/review";
import { sellersByStore, type SellerRef } from "../services/sellers";
import { shopOffers } from "../services/shop";
import { storeListings } from "../stores/listings";
import { readPage } from "../stores/page";
import { conditionOf, stores } from "../stores";
import type { Listing, Store } from "../stores/types";
import { deadline } from "./budget";
import type { JobRun } from "./run";
import { count } from "./summary";

const SURE = 90;
const MAYBE = 50;
// অফিসিয়াল দামের ৪০% এর কম বা আড়াই গুণের বেশি হলে কভার/গ্লাস বা ভুল পণ্য
const PRICE_RANGE = [0.4, 2.5];

interface Tally {
  added: number;
  review: number;
  odd: number;
  failed: number;
}

interface Shop {
  store: Store;
  seller: SellerRef;
  slots: Set<string>;
  official: Map<string, number | null>;
  prices: Map<string, number[]>;
  tally: Tally;
}

interface Spot {
  product: CatalogProduct;
  variant: CatalogVariant;
  listing: Listing;
  title: string;
  condition: string;
  offer: PageOffer;
}

// অফিসিয়াল দামের সীমায় পড়লে আর এই দোকানের ঘর খালি থাকলে ঘরটা এই run এর জন্য রাখা হয়
function claim(shop: Shop, spot: Spot): boolean {
  const official = shop.official.get(spot.variant.id);
  if (official && (spot.offer.price < official * PRICE_RANGE[0] || spot.offer.price > official * PRICE_RANGE[1])) {
    shop.tally.odd++;
    return false;
  }
  const key = slot(spot.variant.id, shop.seller.id, spot.condition);
  if (shop.slots.has(key)) return false;
  shop.slots.add(key);
  return true;
}

// দাম সত্যিই সাইটে বসলে true
async function save(shop: Shop, spot: Spot): Promise<boolean> {
  if (!claim(shop, spot)) return false;
  // অফিসিয়াল দাম না থাকলে অন্য দোকানের দামই ভরসা — দূরের অংক (কটন-বাডসের ৳৩২০ হারের) সরাসরি ঢুকতে দেওয়া হয় না
  const known = shop.prices.get(spot.variant.id);
  if (known && known.length >= 1) {
    const mid = median(known);
    if (spot.offer.price < mid * PRICE_RANGE[0] || spot.offer.price > mid * PRICE_RANGE[1]) {
      await queue(shop, spot, "অন্য দোকানের দামের সাথে অনেক দূরে — ভুল পণ্য বা ভুল পড়া হতে পারে", 60);
      return false;
    }
  }
  await upsertOffer({ variantId: spot.variant.id, sellerId: shop.seller.id, condition: spot.condition, url: spot.listing.url }, spot.offer);
  shop.tally.added++;
  return true;
}

const median = (xs: number[]) => {
  const sorted = [...xs].sort((a, b) => a - b);
  const mid = sorted.length >> 1;
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

async function review(shop: Shop, spot: Spot, reason: string, confidence: number): Promise<boolean> {
  if (claim(shop, spot)) await queue(shop, spot, reason, confidence);
  return false;
}

async function queue(shop: Shop, spot: Spot, reason: string, confidence: number) {
  await enqueue("match", {
    listing: spot.title,
    seller: shop.seller.name,
    price: String(spot.offer.price),
    oldPrice: spot.offer.oldPrice ? String(spot.offer.oldPrice) : "",
    inStock: spot.offer.inStock == null ? "" : String(spot.offer.inStock),
    guess: `${spot.product.name} ${spot.variant.label}`,
    reason,
    confidence: String(confidence),
    variantId: spot.variant.id,
    sellerId: shop.seller.id,
    url: spot.listing.url,
    condition: spot.condition,
    variantKey: spot.offer.key,
    region: spot.offer.region ?? "",
  });
  shop.tally.review++;
}

// পণ্য মেলানো হয় পুরো ক্যাটালগের সাথে, যাতে 13" এর পাতা 15" এর ঘরে না যায়; পাতার শিরোনামে ইঞ্চি বা চিপ অমিল হলে বাদ।
// এক পাতায় একাধিক পণ্য মিললে (যেমন iPad 11 আর 13 একসাথে) শুধু ইঞ্চি লেখা অপশন নেওয়া হয়
async function handle(shop: Shop, listing: Listing, products: CatalogProduct[], wanted: (product: CatalogProduct) => boolean) {
  const page = await readPage(shop.store, listing.url);
  if (!page) return;
  const title = page.title ?? listing.title;
  const named = page.title ? findProducts(page.title, products) : [];
  const chosen = named.length ? named : products.filter((p) => !page.title || sameSpec(page.title, p.name));
  if (chosen.length === 0) return;
  const condition = conditionOf(shop.store, `${listing.url} ${title}`);
  const pictured: CatalogVariant[] = [];
  for (const product of chosen.filter(wanted)) {
    for (const { variants, found } of place(page.offers, product, [title, listing.title], condition, chosen.length > 1)) {
      if (variants.length > 1) {
        const verdict = await judge(title, product, variants);
        if (!verdict.variant || verdict.confidence < MAYBE) continue;
        const spot = { product, variant: verdict.variant, listing, title, condition, offer: found[0] };
        if (await (verdict.confidence >= SURE ? save(shop, spot) : review(shop, spot, verdict.reason, verdict.confidence))) pictured.push(spot.variant);
        continue;
      }
      const offer = single(found);
      const spot = { product, variant: variants[0], listing, title, condition, offer: offer ?? found[0] };
      if (await (offer ? save(shop, spot) : review(shop, spot, "পাতায় একাধিক অপশন এই ভার্সনের সাথে মেলে, সবচেয়ে কম দামটা ধরা হয়েছে", 60))) pictured.push(spot.variant);
    }
  }
  // ছবি শুধু সেই পণ্যে, যার দাম এই পাতা থেকে সত্যিই বসেছে; কভার বা ভুল পণ্যের পাতার ছবি নয়
  if (pictured[0]) await saveProductImage(pictured[0].id, page.image);
}

export interface StoreResult extends Tally {
  store: string;
  notes: string[];
  finished: boolean;
  found: string[];
}

const STORE_MINUTES = 30;

export async function sellerStores(): Promise<{ store: Store; seller: SellerRef }[]> {
  const sellers = await sellersByStore(stores);
  return stores.flatMap((store) => {
    const seller = sellers.get(store.id);
    return seller ? [{ store, seller }] : [];
  });
}

// নতুন বা ভার্সন বদলানো পণ্য থাকলে (আর রাতের নির্ধারিত run না হলে) শুধু সেগুলো, নইলে পুরো ক্যাটালগ।
// নতুন দোকান (এখনো একটাও দাম নেই): হাতে চালালেও পুরো ক্যাটালগ খোঁজা হয়, রাতের run এর অপেক্ষা লাগে না
export async function discoverStore(store: Store, seller: SellerRef): Promise<StoreResult> {
  const result: StoreResult = { store: store.id, added: 0, review: 0, odd: 0, failed: 0, notes: [], finished: true, found: [] };
  const catalog = await loadCatalog();
  if (catalog.length === 0) return result;
  const nightly = process.env.GITHUB_EVENT_NAME === "schedule";
  const pending = catalog.filter((p) => p.pending);
  const fresh = new Set(pending.map((p) => p.id));
  const { slots, urls: known } = await shopOffers(seller.id);
  const targets = nightly || pending.length === 0 || known.size === 0 ? catalog : pending;
  const wanted = new Set(targets.map((p) => p.id));
  const reviewed = await reviewedUrls(seller.id);
  const official = new Map(catalog.flatMap((p) => p.variants.map((v) => [v.id, v.officialPrice] as const)));
  const shop: Shop = { store, seller, slots, official, prices: await variantPrices(), tally: result };
  const outOfTime = deadline(STORE_MINUTES);
  const before = new Set(slots);

  try {
    const listings = (await storeListings(store, targets, catalog, nightly)).flatMap((listing) => {
      const products = reviewed.has(listing.url) ? [] : findProducts(listing.title, catalog);
      const done = known.has(listing.url) && products.every((p) => !fresh.has(p.id));
      return products.some((p) => wanted.has(p.id)) && !done ? [{ listing, products }] : [];
    });
    await pool(
      listings,
      2,
      async ({ listing, products }) => {
        try {
          await handle(shop, listing, products, (p) => wanted.has(p.id));
        } catch (error) {
          if (error instanceof StoreBlocked) throw error;
          if (!(error instanceof NotFound) && !(error instanceof Disallowed)) result.failed++;
        }
      },
      outOfTime,
    );
  } catch (error) {
    result.notes.push(error instanceof StoreBlocked ? `${store.name}: blocked (${message(error)})` : `${store.name}: ${message(error)}`);
  }
  result.found = [...slots].filter((key) => !before.has(key)).map((key) => key.split("|")[0]);
  if (outOfTime()) {
    result.finished = false;
    result.notes.push(`${store.name}: ${bn(STORE_MINUTES)} মিনিটে শেষ হয়নি, বাকিটা পরের বার`);
  }
  return result;
}

// সব দোকানের ফল এক বার্তায়; কোনো দোকান সময়ে শেষ না হলে বা ফল না এলে নতুন পণ্য পরের run এ আবার খোঁজা হয়
export async function summarize(results: StoreResult[], startedAt: string, expected: number): Promise<string> {
  const catalog = await loadCatalog();
  if (catalog.length === 0) return "ক্যাটালগে কোনো পণ্য নেই";
  const total = (key: keyof Tally) => results.reduce((sum, r) => sum + r[key], 0);
  const notes = results.flatMap((r) => r.notes);
  const sellers = await sellersByStore(stores);
  notes.push(...stores.filter((s) => !sellers.has(s.id)).map((s) => `${s.name}: বিক্রেতা তালিকায় নেই`));
  if (total("added") + total("review") === 0 && results.length > 0 && results.every((r) => r.notes.length > 0)) throw new Error(notes.join("; "));

  const pending = catalog.filter((p) => p.pending);
  if (results.length === expected && results.every((r) => r.finished)) await markDiscovered(pending.map((p) => p.id), startedAt);
  const offered = new Set([...[...(await offerSlots())].map((key) => key.split("|")[0]), ...results.flatMap((r) => r.found)]);
  const missing = pending.filter((p) => !p.variants.some((v) => offered.has(v.id))).map((p) => p.name);
  const parts = [count(total("added"), "নতুন দাম"), `${bn(total("review"))}টা যাচাইয়ে`];
  if (pending.length) parts.unshift(count(pending.length, "নতুন পণ্য খোঁজা হয়েছে"));
  if (missing.length) parts.push(`কোনো দোকানে পাওয়া যায়নি: ${missing.slice(0, 5).join(", ")}`);
  if (total("odd")) parts.push(count(total("odd"), "দাম অফিসিয়ালের সাথে মেলেনি বলে বাদ"));
  if (total("failed")) parts.push(count(total("failed"), "ব্যর্থ"));
  if (results.length < expected) parts.push(count(expected - results.length, "দোকানের ফল আসেনি, পরের বার আবার"));
  return [parts.join(", "), ...notes].join("; ");
}

// এক প্রসেসে সব দোকান একসাথে (লোকাল worker); GitHub এ প্রতিটা দোকান আলাদা job, দেখুন jobs/matrix.ts
export async function discover(run: JobRun): Promise<string> {
  const active = await sellerStores();
  const results = await Promise.all(active.map(({ store, seller }) => discoverStore(store, seller)));
  return summarize(results, run.startedAt, active.length);
}
