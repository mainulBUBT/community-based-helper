import type { OfferView, PricePoint, ProductSummary } from "@/types/catalog";

export const byPrice = (a: { price: number }, b: { price: number }) => a.price - b.price;

// বানান আর ফাঁকা জায়গা বাদে একই নাম, অথবা শুধু শেষে সাইজ বাড়তি ("Galaxy Watch8" আর "Galaxy Watch 8 40mm") মানে একই পণ্য
const nameKey = (brand: string, name: string) => `${brand} ${name}`.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");
const SIZE_TAIL = /^(?![2-5]g$)\d+(?:mm|gb|tb|ml|g|mah|inch|in)$/;

export function sameProduct(a: { brand: string; name: string }, b: { brand: string; name: string }) {
  const [x, y] = [nameKey(a.brand, a.name), nameKey(b.brand, b.name)].sort((p, q) => p.length - q.length);
  return x === y || (y.startsWith(x) && SIZE_TAIL.test(y.slice(x.length)));
}

export const byPopularity = (a: ProductSummary, b: ProductSummary) => b.product.popularity - a.product.popularity;

// স্টকে আছে বা জানা নেই আগে, "আপাতত নেই" শেষে; বাকি ক্রম আগের মতোই থাকে
export const byStock = (a: { inStock: boolean | null }, b: { inStock: boolean | null }) => Number(b.inStock !== false) - Number(a.inStock !== false);

export function toCard(summary: ProductSummary): ProductSummary {
  const { id, slug, name, brand, category, releaseYear, popularity, variants, images } = summary.product;
  return { ...summary, product: { id, slug, name, brand, category, releaseYear, popularity, variants, images: images?.slice(0, 1) } };
}

export function lowestOffer(offers: OfferView[]) {
  return offers.filter((offer) => offer.inStock !== false).sort(byPrice)[0] ?? offers.slice().sort(byPrice)[0] ?? null;
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
