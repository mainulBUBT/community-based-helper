import { bn } from "../lib/bn";
import { Disallowed, NotFound, StoreBlocked, message } from "../lib/errors";
import { judge } from "../lib/judge";
import { matchListing, type CatalogProduct, type Match } from "../lib/match";
import { pool } from "../lib/pool";
import type { Quote } from "../lib/price";
import { loadCatalog } from "../services/catalog";
import { knownOfferUrls, saveQuote } from "../services/offers";
import { enqueue, reviewedUrls } from "../services/review";
import { sellersByStore, type SellerRef } from "../services/sellers";
import { readQuote } from "../stores/page";
import { stores } from "../stores";
import type { Listing, Store } from "../stores/types";
import { deadline } from "./budget";
import { blockedNote, count } from "./summary";

const SURE = 90;
const MAYBE = 50;

interface Tally {
  added: number;
  review: number;
  failed: number;
}

async function resolve(title: string, match: Match) {
  if (match.kind === "sure") return { product: match.product, variant: match.variant, confidence: 95, reason: "নাম আর স্টোরেজ মিলেছে" };
  const verdict = await judge(title, match.product, match.variants);
  return { product: match.product, variant: verdict.variant, confidence: verdict.confidence, reason: verdict.reason };
}

async function quoteFor(store: Store, listing: Listing): Promise<Quote | null> {
  if (listing.price) return { price: listing.price, oldPrice: listing.oldPrice, inStock: null, title: listing.title, via: "listing" };
  return readQuote(store, listing.url);
}

async function handle(store: Store, seller: SellerRef, listing: Listing, catalog: CatalogProduct[], tally: Tally) {
  const quote = await quoteFor(store, listing);
  if (!quote) return;
  const title = quote.title ?? listing.title;
  const match = matchListing(title, catalog);
  if (!match) return;
  const { product, variant, confidence, reason } = await resolve(title, match);
  if (!variant || confidence < MAYBE) return;
  const productLabel = `${product.name} ${variant.label}`;
  if (confidence >= SURE) {
    await saveQuote({ variantId: variant.id, sellerId: seller.id, url: listing.url, productLabel, sellerName: seller.name }, quote);
    tally.added++;
    return;
  }
  await enqueue("match", {
    listing: title,
    seller: seller.name,
    price: String(quote.price),
    oldPrice: quote.oldPrice ? String(quote.oldPrice) : "",
    inStock: quote.inStock == null ? "" : String(quote.inStock),
    guess: productLabel,
    reason,
    confidence: String(confidence),
    variantId: variant.id,
    sellerId: seller.id,
    url: listing.url,
  });
  tally.review++;
}

export async function discover(): Promise<string> {
  const catalog = await loadCatalog();
  if (catalog.length === 0) return "ক্যাটালগে কোনো পণ্য নেই";
  const sellers = await sellersByStore(stores);
  const known = new Set([...(await knownOfferUrls()), ...(await reviewedUrls())]);
  const names = catalog.map((p) => p.name);
  const tally: Tally = { added: 0, review: 0, failed: 0 };
  const outOfTime = deadline(40);
  const notes: string[] = [];

  await Promise.all(
    stores.map(async (store) => {
      const seller = sellers.get(store.id);
      if (!seller) return notes.push(`${store.name}: বিক্রেতা তালিকায় নেই`);
      try {
        const listings = (await store.discover(names)).filter((l) => !known.has(l.url) && matchListing(l.title, catalog));
        await pool(
          listings,
          2,
          async (listing) => {
            try {
              await handle(store, seller, listing, catalog, tally);
            } catch (error) {
              if (error instanceof StoreBlocked) throw error;
              if (!(error instanceof NotFound) && !(error instanceof Disallowed)) tally.failed++;
            }
          },
          outOfTime,
        );
      } catch (error) {
        if (!(error instanceof StoreBlocked)) notes.push(`${store.name}: ${message(error)}`);
      }
    }),
  );

  if (tally.added + tally.review === 0 && notes.length === stores.length) throw new Error(notes.join("; "));
  const parts = [`${count(tally.added, "নতুন দাম")}`, `${bn(tally.review)}টা যাচাইয়ে`];
  if (tally.failed) parts.push(count(tally.failed, "ব্যর্থ"));
  return [parts.join(", "), ...notes].join("; ") + blockedNote();
}
