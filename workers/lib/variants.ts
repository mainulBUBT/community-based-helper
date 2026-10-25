import { canonicalRegion } from "../../src/utils/region";
import type { ShopVariant } from "../stores/types";
import { chip, inch, matchListing, sameSpec, tokens, type CatalogProduct, type CatalogVariant } from "./match";

export interface PageOffer {
  key: string;
  label: string;
  price: number;
  oldPrice: number | null;
  inStock: boolean | null;
  region: string | null;
}

export interface VariantTarget {
  product: string;
  label: string;
  siblings: string[];
  condition: string;
  price?: number;
  key?: string | null;
}

const MEMORY = /^\d+(gb|tb)$/;
const CORES = /(\d+)\s*-?\s*c(?:ore)?s?\s*(cpu|gpu)\b/gi;

// "10 Core CPU 8 Core GPU", "10C CPU/8C GPU" আর "8-core GPU" একই ভাবে: cpu10, gpu8
function words(text: string): string[] {
  const cores = [...text.matchAll(CORES)].map(([, n, kind]) => `${kind.toLowerCase()}${n}`);
  return [...tokens(text.replace(CORES, " ")), ...cores];
}

const isStorage = (t: string) => t.endsWith("tb") || parseInt(t, 10) >= 64;
const stockRank = (o: PageOffer) => (o.inStock === true ? 2 : o.inStock === null ? 1 : 0);

function better(a: PageOffer, b: PageOffer) {
  if (stockRank(a) !== stockRank(b)) return stockRank(a) > stockRank(b);
  return a.price < b.price;
}

// রং আর region আলাদা অপশন নয়: একই স্টোরেজ/সাইজের মধ্যে স্টকে থাকা সবচেয়ে কম দামটা
export function pageOffers(rows: ShopVariant[]): PageOffer[] {
  const best = new Map<string, PageOffer>();
  for (const row of rows) {
    const label = row.options.filter(Boolean).join(" / ");
    const offer = { key: [...new Set(words(label))].sort().join(" "), label, price: row.price, oldPrice: row.oldPrice, inStock: row.inStock, region: canonicalRegion(row.region) };
    const prior = best.get(offer.key);
    if (!prior || better(offer, prior)) best.set(offer.key, offer);
  }
  return [...best.values()];
}

function distinct(labels: string[]): Set<string> {
  const sets = labels.map((label) => new Set(words(label)));
  const all = new Set(sets.flatMap((s) => [...s]));
  return new Set([...all].filter((t) => !sets.every((s) => s.has(t))));
}

const SPEC = /^(\d+(gb|tb|mm)|cpu\d+|gpu\d+|cellular|wifi|gps|lte|bluetooth|official|unofficial)$/;
const CONNECTIVITY = ["wifi", "gps", "cellular", "lte", "bluetooth"];
const OPENED = /\b(just\s+active|activated|used|refurbished|pre-?owned|open\s+box)\b/i;

// ভার্সন চেনায় শুধু স্পেক আর ক্যাটালগের লেবেলের শব্দ; রং, region, সিম, ওয়ারেন্টি এক করে সবচেয়ে কম দাম
function project(offer: PageOffer, keep: Set<string>): string {
  const parts = [...new Set(words(offer.label).filter((t) => SPEC.test(t) || keep.has(t)))].sort();
  const size = inch(offer.label);
  const cpu = chip(offer.label);
  return ["~", ...parts, size === null ? "" : `inch${size}`, cpu ?? ""].filter(Boolean).join(" ");
}

function fold(offers: PageOffer[], keep: Set<string>): PageOffer[] {
  const best = new Map<string, PageOffer>();
  for (const offer of offers.filter((o) => !OPENED.test(o.label))) {
    const key = project(offer, keep);
    const prior = best.get(key);
    if (!prior || better(offer, prior)) best.set(key, { ...offer, key });
  }
  return [...best.values()];
}

const plain = (offer: PageOffer) => !offer.key || offer.key === "~";

function fits(offer: PageOffer, target: VariantTarget, differ: Set<string>, alone: boolean, needsInch: boolean): boolean {
  if (plain(offer)) return alone;
  if (needsInch && inch(offer.label) === null) return false;
  const opt = new Set(words(offer.label));
  const ownText = `${target.product} ${target.label}`;
  const own = new Set(words(ownText));
  const memory = [...opt].filter((t) => MEMORY.test(t));
  const ownMemory = [...own].filter((t) => MEMORY.test(t));
  const optRam = memory.some((t) => !isStorage(t));
  if (ownMemory.some((t) => !opt.has(t) && memory.length && (isStorage(t) || differ.has(t) || optRam))) return false;
  if (memory.some((t) => isStorage(t) && !own.has(t))) return false;
  if ([...differ].some((t) => opt.has(t) && !own.has(t))) return false;
  if (CONNECTIVITY.some((t) => opt.has(t)) && opt.has("cellular") !== own.has("cellular")) return false;
  if (opt.has("official") && target.condition !== "official") return false;
  if (["unofficial", "intl", "international"].some((t) => opt.has(t)) && target.condition === "official") return false;
  return sameSpec(offer.label, ownText);
}

// alone: পাতায় এই দোকানের একটাই ভার্সন ট্র্যাক হয়, তাই অপশনহীন দামও চলে
// needsInch: এক পাতায় একাধিক সাইজের পণ্য (যেমন iPad 11/13), তাই ইঞ্চি লেখা অপশনই শুধু
// key আগে বাঁধা থাকলে সেটাই; না হলে আগের দামের সাথে হুবহু মেলা অপশন (মানুষ যেটা দেখে বসিয়েছে), নইলে স্পেক মিলিয়ে সবচেয়ে কমটা
export function candidates(offers: PageOffer[], target: VariantTarget, alone: boolean, needsInch = false): PageOffer[] {
  const keep = new Set(target.siblings.flatMap(words));
  const folded = fold(offers, keep);
  if (target.key) {
    const bound = [...offers, ...folded].find((o) => o.key === target.key);
    if (bound) return [bound];
  }
  const differ = distinct(target.siblings);
  const own = new Set(words(`${target.product} ${target.label}`));
  const score = (o: PageOffer) => words(o.label).filter((t) => differ.has(t) && own.has(t)).length;
  const exact = offers.filter((o) => o.price === target.price && fits(o, target, differ, alone, needsInch));
  const pool = exact.length ? exact : folded.filter((o) => fits(o, target, differ, alone, needsInch));
  const top = Math.max(...pool.map(score));
  return pool.filter((o) => score(o) === top).sort((a, b) => a.price - b.price);
}

export interface Placement {
  variants: CatalogVariant[];
  found: PageOffer[];
}

// নতুন listing এর কোন অপশন কোন ভার্সনের: অপশন থাকলে স্পেক মিলিয়ে, না থাকলে (ভার্সন-প্রতি আলাদা পাতা) শিরোনাম থেকে
export function place(offers: PageOffer[], product: CatalogProduct, titles: string[], condition: string, needsInch = false): Placement[] {
  const siblings = product.variants.map((v) => v.label);
  const folded = fold(offers, new Set(siblings.flatMap(words)));
  if (folded.length === 1 && plain(folded[0])) {
    if (needsInch) return [];
    if (product.variants.length === 1) return [{ variants: product.variants, found: folded }];
    const match = titles.map((title) => matchListing(title, [product])).find(Boolean);
    return match ? [{ variants: match.kind === "sure" ? [match.variant] : match.variants, found: folded }] : [];
  }
  return product.variants.flatMap((variant) => {
    const found = candidates(offers, { product: product.name, label: variant.label, siblings, condition }, product.variants.length === 1, needsInch);
    return found.length ? [{ variants: [variant], found }] : [];
  });
}

export function single(found: PageOffer[]): PageOffer | null {
  if (found.length === 1) return found[0];
  return found.length > 1 && found.every((o) => o.price === found[0].price) ? found[0] : null;
}
