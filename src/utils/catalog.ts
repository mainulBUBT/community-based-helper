import type { OfferView, PricePoint, Product } from "@/types/catalog";

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
