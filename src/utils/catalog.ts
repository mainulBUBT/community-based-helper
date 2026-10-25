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

export function dailyLowest(history: PricePoint[], days = 30, now = Date.now()) {
  const start = now - days * 86400000;
  const perDay = new Map<number, number>();
  for (const point of history) {
    const time = new Date(point.seenAt).getTime();
    if (time < start) continue;
    const day = Math.floor((time - start) / 86400000);
    perDay.set(day, Math.min(perDay.get(day) ?? Infinity, point.price));
  }
  const points: { day: number; price: number }[] = [];
  let last: number | undefined;
  for (let day = 0; day <= days; day++) {
    last = perDay.get(day) ?? last;
    if (last !== undefined) points.push({ day, price: last });
  }
  return points;
}
