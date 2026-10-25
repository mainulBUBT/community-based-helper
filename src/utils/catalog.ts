import type { OfferView, PricePoint, Product, ProductSummary } from "@/types/catalog";

const ALIASES: Record<string, string> = {
  আইফোন: "iphone",
  আইপ্যাড: "ipad",
  ম্যাকবুক: "macbook",
  অ্যাপল: "apple",
  স্যামসাং: "samsung",
  গ্যালাক্সি: "galaxy",
  শাওমি: "xiaomi",
  রেডমি: "redmi",
  রিয়েলমি: "realme",
  ঘড়ি: "watch",
  ওয়াচ: "watch",
  মোবাইল: "",
  ফোন: "",
  দাম: "",
};

export const byPrice = (a: { price: number }, b: { price: number }) => a.price - b.price;

// বানান আর ফাঁকা জায়গা বাদে একই নাম, অথবা শুধু শেষে সাইজ বাড়তি ("Galaxy Watch8" আর "Galaxy Watch 8 40mm") মানে একই পণ্য
const nameKey = (brand: string, name: string) => `${brand} ${name}`.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");
const SIZE_TAIL = /^\d+(?:mm|gb|tb|ml|g|mah|inch|in)$/;

export function sameProduct(a: { brand: string; name: string }, b: { brand: string; name: string }) {
  const [x, y] = [nameKey(a.brand, a.name), nameKey(b.brand, b.name)].sort((p, q) => p.length - q.length);
  return x === y || (y.startsWith(x) && SIZE_TAIL.test(y.slice(x.length)));
}

export const byPopularity = (a: ProductSummary, b: ProductSummary) => b.product.popularity - a.product.popularity;

export function toCard(summary: ProductSummary): ProductSummary {
  const { id, slug, name, brand, category, releaseYear, popularity, variants, images } = summary.product;
  return { ...summary, product: { id, slug, name, brand, category, releaseYear, popularity, variants, images: images?.slice(0, 1) } };
}

export function lowestOffer(offers: OfferView[]) {
  return offers.filter((offer) => offer.inStock !== false).sort(byPrice)[0] ?? offers.slice().sort(byPrice)[0] ?? null;
}

export function queryWords(query: string) {
  return query
    .toLowerCase()
    .split(/\s+/)
    .map((word) => ALIASES[word] ?? word)
    .filter(Boolean);
}

export function matchesQuery(product: Product, query: string) {
  const words = queryWords(query);
  const haystack = `${product.brand} ${product.name} ${product.variants.map((v) => v.label).join(" ")}`.toLowerCase().replace(/\s+/g, " ");
  const compact = haystack.replace(/\s/g, "");
  return words.every((word) => haystack.includes(word) || compact.includes(word));
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
export function dailyRange(history: PricePoint[], offers: { id: string; price: number }[], days = 30, now = Date.now()): DayRange[] {
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
    return { id: offer.id, list: list.length ? list : [{ day: 0, price: offer.price }] };
  });
  const result: DayRange[] = [];
  for (let day = 0; day <= days; day++) {
    let low = Infinity;
    let high = -Infinity;
    let lowOfferId = "";
    let shops = 0;
    for (const { id, list } of series) {
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
