import { bn } from "../lib/bn";
import { Disallowed, NotFound, StoreBlocked, message } from "../lib/errors";
import { judge } from "../lib/judge";
import { findProducts, sameSpec, type CatalogProduct, type CatalogVariant } from "../lib/match";
import { pool } from "../lib/pool";
import { place, single, type PageOffer } from "../lib/variants";
import { loadCatalog, markDiscovered } from "../services/catalog";
import { knownOfferUrls, offerSlots, saveProductImage, slot, upsertOffer, variantPrices } from "../services/offers";
import { enqueue, reviewedUrls } from "../services/review";
import { sellersByStore, type SellerRef } from "../services/sellers";
import { readPage } from "../stores/page";
import { conditionOf, stores } from "../stores";
import type { Listing, Store } from "../stores/types";
import { deadline } from "./budget";
import { blockedNote, count } from "./summary";

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

async function save(shop: Shop, spot: Spot) {
  if (!claim(shop, spot)) return;
  // অফিসিয়াল দাম না থাকলে অন্য দোকানের দামই ভরসা — দূরের অংক (কটন-বাডসের ৳৩২০ হারের) সরাসরি ঢুকতে দেওয়া হয় না
  const known = shop.prices.get(spot.variant.id);
  if (known && known.length >= 1) {
    const mid = median(known);
    if (spot.offer.price < mid * PRICE_RANGE[0] || spot.offer.price > mid * PRICE_RANGE[1]) {
      await review(shop, spot, "অন্য দোকানের দামের সাথে অনেক দূরে — ভুল পণ্য বা ভুল পড়া হতে পারে", 60);
      return;
    }
  }
  await upsertOffer({ variantId: spot.variant.id, sellerId: shop.seller.id, condition: spot.condition, url: spot.listing.url }, spot.offer);
  shop.tally.added++;
}

const median = (xs: number[]) => {
  const sorted = [...xs].sort((a, b) => a - b);
  const mid = sorted.length >> 1;
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

async function review(shop: Shop, spot: Spot, reason: string, confidence: number) {
  if (!claim(shop, spot)) return;
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
  for (const product of chosen.filter(wanted)) {
    for (const { variants, found } of place(page.offers, product, [title, listing.title], condition, chosen.length > 1)) {
      if (variants.length > 1) {
        const verdict = await judge(title, product, variants);
        if (!verdict.variant || verdict.confidence < MAYBE) continue;
        const spot = { product, variant: verdict.variant, listing, title, condition, offer: found[0] };
        await (verdict.confidence >= SURE ? save(shop, spot) : review(shop, spot, verdict.reason, verdict.confidence));
        continue;
      }
      const offer = single(found);
      const spot = { product, variant: variants[0], listing, title, condition, offer: offer ?? found[0] };
      await (offer ? save(shop, spot) : review(shop, spot, "পাতায় একাধিক অপশন এই ভার্সনের সাথে মেলে, সবচেয়ে কম দামটা ধরা হয়েছে", 60));
    }
  }
  const first = chosen[0].variants[0];
  if (first) await saveProductImage(first.id, page.image);
}

// নতুন বা ভার্সন বদলানো পণ্য থাকলে (আর রাতের নির্ধারিত run না হলে) শুধু সেগুলো, নইলে পুরো ক্যাটালগ
export async function discover(): Promise<string> {
  const startedAt = new Date().toISOString();
  const catalog = await loadCatalog();
  if (catalog.length === 0) return "ক্যাটালগে কোনো পণ্য নেই";
  const pending = catalog.filter((p) => p.pending);
  const targets = pending.length && process.env.GITHUB_EVENT_NAME !== "schedule" ? pending : catalog;
  const fresh = new Set(pending.map((p) => p.id));
  const sellers = await sellersByStore(stores);
  const slots = await offerSlots();
  const prices = await variantPrices();
  const known = await knownOfferUrls();
  const reviewed = await reviewedUrls();
  const wanted = new Set(targets.map((p) => p.id));
  const everything = new Set(catalog.map((p) => p.id));
  const host = (url: string) => new URL(url).host.replace(/^www\./, "");
  const knownHosts = new Set([...known].flatMap((url) => { try { return [host(url)]; } catch { return []; } }));
  const official = new Map(catalog.flatMap((p) => p.variants.map((v) => [v.id, v.officialPrice] as const)));
  const tally: Tally = { added: 0, review: 0, odd: 0, failed: 0 };
  const outOfTime = deadline(40);
  const notes: string[] = [];

  const STORE_TIMEOUT_MS = 8 * 60 * 1000;
  await Promise.all(
    stores.map(async (store) => {
      const seller = sellers.get(store.id);
      if (!seller) return notes.push(`${store.name}: বিক্রেতা তালিকায় নেই`);
      const shop: Shop = { store, seller, slots, official, prices, tally };
      // নতুন দোকান (এখনো একটাও দাম নেই): হাতে চালালেও পুরো ক্যাটালগ খোঁজা হয়, রাতের run এর অপেক্ষা লাগে না
      const whole = !knownHosts.has(host(store.origin));
      const storeTargets = whole ? catalog : targets;
      const storeWanted = whole ? everything : wanted;
      const runStore = async () => {
        try {
          const listings = (await store.discover(storeTargets)).flatMap((listing) => {
            const products = reviewed.has(listing.url) ? [] : findProducts(listing.title, catalog);
            const done = known.has(listing.url) && products.every((p) => !fresh.has(p.id));
            return products.some((p) => storeWanted.has(p.id)) && !done ? [{ listing, products }] : [];
          });
          await pool(
            listings,
            2,
            async ({ listing, products }) => {
              try {
                await handle(shop, listing, products, (p) => storeWanted.has(p.id));
              } catch (error) {
                if (error instanceof StoreBlocked) throw error;
                if (!(error instanceof NotFound) && !(error instanceof Disallowed)) tally.failed++;
              }
            },
            outOfTime,
          );
        } catch (error) {
          if (error instanceof StoreBlocked) notes.push(`${store.name}: blocked (${message(error)})`);
          else notes.push(`${store.name}: ${message(error)}`);
        }
      };
      // একটা দোকান আটকে গেলেও বাকিরা চলবে — per-store timeout
      await Promise.race([
        runStore(),
        new Promise<void>((resolve) => {
          setTimeout(() => {
            notes.push(`${store.name}: timeout ${STORE_TIMEOUT_MS / 60000}m, skipped`);
            resolve();
          }, STORE_TIMEOUT_MS);
        }),
      ]);
    }),
  );

  if (tally.added + tally.review === 0 && notes.length === stores.length) throw new Error(notes.join("; "));
  if (!outOfTime()) await markDiscovered([...fresh], startedAt);
  const offered = new Set([...slots].map((key) => key.split("|")[0]));
  const missing = pending.filter((p) => !p.variants.some((v) => offered.has(v.id))).map((p) => p.name);
  const parts = [count(tally.added, "নতুন দাম"), `${bn(tally.review)}টা যাচাইয়ে`];
  if (pending.length) parts.unshift(count(pending.length, "নতুন পণ্য খোঁজা হয়েছে"));
  if (missing.length) parts.push(`কোনো দোকানে পাওয়া যায়নি: ${missing.slice(0, 5).join(", ")}`);
  if (tally.odd) parts.push(count(tally.odd, "দাম অফিসিয়ালের সাথে মেলেনি বলে বাদ"));
  if (tally.failed) parts.push(count(tally.failed, "ব্যর্থ"));
  if (outOfTime()) parts.push("সময় শেষ, বাকিটা পরের বার");
  return [parts.join(", "), ...notes].join("; ") + blockedNote();
}
