import type { Offer, OfferView, PricePoint, ProductSummary } from "@/types/catalog";

export const byPrice = (a: { price: number }, b: { price: number }) => a.price - b.price;

const DAY = 86400000;

// "আগের দাম" এই দোকানে গত মাসে একবারও নেয়নি; অন্তত ২ সপ্তাহের ইতিহাস না থাকলে বলা যায় না
export function neverCharged(offer: Offer, history: PricePoint[]) {
  if (!offer.oldPrice || offer.oldPrice <= offer.price) return false;
  const points = history.filter((point) => point.offerId === offer.id);
  if (points.length < 2) return false;
  const times = points.map((point) => Date.parse(point.seenAt));
  if (Math.max(...times) - Math.min(...times) < 14 * DAY) return false;
  return Math.max(...points.map((point) => point.price)) < offer.oldPrice;
}

// বানান আর ফাঁকা জায়গা বাদে একই নাম, অথবা শুধু শেষে সাইজ বাড়তি ("Galaxy Watch8" আর "Galaxy Watch 8 40mm") মানে একই পণ্য
const nameKey = (brand: string, name: string) => `${brand} ${name}`.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");
const SIZE_TAIL = /^(?![2-5]g$)\d+(?:mm|gb|tb|ml|g|mah|inch|in)$/;

// সাইট নামের আগে ব্র্যান্ড নিজেই বসায়; নামেও ব্র্যান্ড থাকলে "Anker Anker ..." হয়ে যায়
export function withoutBrand(brand: string, name: string) {
  const prefix = `${brand.trim()} `.toLowerCase();
  const trimmed = name.trim();
  return trimmed.toLowerCase().startsWith(prefix) && trimmed.length > prefix.length ? trimmed.slice(prefix.length).trim() : trimmed;
}

export function sameProduct(a: { brand: string; name: string }, b: { brand: string; name: string }) {
  const [x, y] = [nameKey(a.brand, a.name), nameKey(b.brand, b.name)].sort((p, q) => p.length - q.length);
  return x === y || (y.startsWith(x) && SIZE_TAIL.test(y.slice(x.length)));
}

export const byPopularity = (a: ProductSummary, b: ProductSummary) => b.product.popularity - a.product.popularity;

// স্টকে আছে বা জানা নেই আগে, "আপাতত নেই" শেষে; বাকি ক্রম আগের মতোই থাকে
export const byStock = (a: { inStock: boolean | null }, b: { inStock: boolean | null }) => Number(b.inStock !== false) - Number(a.inStock !== false);

export function toCard(summary: ProductSummary): ProductSummary {
  const { id, slug, name, brand, category, releaseYear, popularity, variants, images, tags } = summary.product;
  return { ...summary, product: { id, slug, name, brand, category, releaseYear, popularity, variants, images: images?.slice(0, 1), ...(tags?.length ? { tags } : {}) } };
}

export function lowestOffer(offers: OfferView[]) {
  return offers.filter((offer) => offer.inStock !== false).sort(byPrice)[0] ?? offers.slice().sort(byPrice)[0] ?? null;
}

// দোকানের লেখা "আগের দাম" অফিসিয়াল দামের চেয়ে বেশি হলে বানানো (Dazzle-এ MacBook Air M3: অফিসিয়াল ৳১,৩৪,৯৯৯, "আগে" ৳১,৮৯,৯৯০)
export const realOldPrice = (oldPrice: number | null | undefined, official: number | null | undefined) =>
  oldPrice && (!official || oldPrice <= official) ? oldPrice : null;

export interface RecentDrop {
  productId: string;
  from: number;
  amount: number;
  daysAgo: number;
}

const DHAKA_OFFSET = 6 * 3600000;
// ৳৩৯,৩০০ থেকে ৳৩৯,২৯৯ "দাম কমল" নয়
const MIN_DROP = 10;
const MIN_DROP_SHARE = 0.005;
const dhakaDay = (ms: number) => Math.floor((ms + DHAKA_OFFSET) / 86400000);


// আসল দাম কমা: এখনকার সবচেয়ে কম দামটা কোনো দোকান গত `days` দিনে কমিয়েছে, আর তার ঠিক আগে পণ্যের সবচেয়ে কম দাম এর চেয়ে বেশি ছিল।
// দোকানের নিজের আগের দামের চেয়ে কমতে হবে, তাই নতুন দোকান যোগ হয়ে সস্তা হওয়া ধরা হয় না; আগের হিসাবে এখন স্টকে না থাকা দোকানও থাকে, যাতে ভুল করে বাড়তি "কমেছে" না দেখায়
export function recentDrops(summaries: ProductSummary[], offers: Offer[], history: PricePoint[], days = 7, now = Date.now()): RecentDrop[] {
  const points = new Map<string, PricePoint[]>();
  for (const point of history) points.set(point.offerId, [...(points.get(point.offerId) ?? []), point]);
  for (const list of points.values()) list.sort((a, b) => a.seenAt.localeCompare(b.seenAt));
  // ওই সময়ের ঠিক আগে দোকানের দাম; ইতিহাসের সময়সীমায় কোনো বদল না থাকলে এখনকার দামই তখনকার, আর প্রথম দামের আগে দোকান ছিল না
  const priceBefore = (offer: Offer, time: number) => {
    const list = points.get(offer.id);
    return list ? (list.filter((p) => Date.parse(p.seenAt) < time).at(-1)?.price ?? null) : offer.price;
  };
  const byVariant = new Map<string, Offer[]>();
  for (const offer of offers) byVariant.set(offer.variantId, [...(byVariant.get(offer.variantId) ?? []), offer]);
  const today = dhakaDay(now);
  const drops: RecentDrop[] = [];
  for (const { product, lowest } of summaries) {
    if (!lowest) continue;
    const own = product.variants.flatMap((v) => byVariant.get(v.id) ?? []);
    for (const offer of own.filter((o) => o.inStock !== false && o.price === lowest)) {
      const [previous, last] = points.get(offer.id)?.slice(-2) ?? [];
      if (!previous || !last || last.price !== offer.price || last.price >= previous.price) continue;
      const time = Date.parse(last.seenAt);
      const daysAgo = today - dhakaDay(time);
      if (daysAgo >= days) continue;
      const before = own.map((o) => priceBefore(o, time)).filter((p): p is number => p !== null);
      const from = before.length ? Math.min(...before) : null;
      if (from && from - lowest >= MIN_DROP && from - lowest >= from * MIN_DROP_SHARE) {
        drops.push({ productId: product.id, from, amount: from - lowest, daysAgo });
        break;
      }
    }
  }
  return drops.sort((a, b) => b.amount - a.amount);
}

export interface DayRange {
  day: number;
  low: number;
  high: number;
  lowOfferId: string;
  shops: number;
}

// প্রতিদিন প্রতিটা দোকানের তখনকার দাম (শেষ বদলের দাম চলতে থাকে) থেকে সেদিনের সবচেয়ে কম আর বেশি।
// ইতিহাসে শুধু দাম বদলের দিন থাকে; কোনো দোকানের সময়সীমার ভেতরে বদল না থাকলে তার এখনকার দামই পুরো সময় ধরা হয়
export function dailyRange(history: PricePoint[], offers: { id: string; price: number; inStock?: boolean | null }[], days = 30, now = Date.now()): DayRange[] {
  const start = now - days * 86400000;
  const dayOf = (iso: string) => Math.floor((new Date(iso).getTime() - start) / 86400000);
  const changes = new Map<string, { day: number; price: number }[]>();
  for (const point of history) {
    const list = changes.get(point.offerId) ?? [];
    list.push({ day: Math.max(0, dayOf(point.seenAt)), price: point.price });
    changes.set(point.offerId, list);
  }
  const series = offers.map((offer) => {
    const list = (changes.get(offer.id) ?? []).sort((a, b) => a.day - b.day);
    return { id: offer.id, out: offer.inStock === false, list: list.length ? list : [{ day: 0, price: offer.price }] };
  });
  // আগের দিনের স্টক জানা নেই, তাই শুধু আজকের দিনে "আপাতত নেই" দোকান বাদ (সব দোকানে না থাকলে বাদ নয়)
  const skipOut = series.some((s) => !s.out);
  const result: DayRange[] = [];
  for (let day = 0; day <= days; day++) {
    let low = Infinity;
    let high = -Infinity;
    let lowOfferId = "";
    let shops = 0;
    for (const { id, out, list } of series) {
      if (day === days && out && skipOut) continue;
      const current = list.filter((c) => c.day <= day).at(-1);
      if (!current) continue;
      shops++;
      if (current.price < low) [low, lowOfferId] = [current.price, id];
      high = Math.max(high, current.price);
    }
    if (shops) result.push({ day, low, high, lowOfferId, shops });
  }
  return result;
}
