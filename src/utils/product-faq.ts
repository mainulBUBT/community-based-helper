import type { Messages } from "@/i18n/bn";
import type { Lang } from "@/lib/preferences";
import type { OfferView, PricePoint, Product } from "@/types/catalog";
import { formatTaka, toBnDigits } from "@/utils/format";

const lowest = (offers: OfferView[]) => Math.min(...offers.map((o) => o.price));

// পণ্যের পাতার প্রশ্ন-উত্তর আসল দাম থেকে লেখা; পাতায় যা দেখায়, JSON-LD তেও ঠিক তাই
export function productFaq(product: Product, offers: OfferView[], history: PricePoint[], warranty: boolean, t: Messages, lang: Lang) {
  const available = offers.filter((o) => o.inStock !== false);
  const pool = available.length ? available : offers;
  if (!pool.length) return [];
  const name = `${product.brand} ${product.name}`;
  const taka = (n: number) => formatTaka(n, lang);
  const count = (n: number) => (lang === "bn" ? toBnDigits(n) : String(n));
  const many = product.variants.length > 1;
  const best = pool.reduce((a, b) => (b.price < a.price ? b : a));
  const high = Math.max(...pool.map((o) => o.price));
  const shops = new Set(pool.map((o) => o.sellerId)).size;
  const label = (id: string) => product.variants.find((v) => v.id === id)?.label ?? null;
  const faq = [{ q: t.faq.priceQ(name), a: t.faq.priceA(taka(best.price), best.seller.name, many ? label(best.variantId) : null, count(shops), high > best.price ? taka(high) : null) }];

  // একই ভার্সনে দুই ধরনের দাম থাকলে তবেই তুলনা, নইলে 256GB আর 1TB মিশে যায়
  if (warranty) {
    const pairs = product.variants.flatMap((v) => {
      const own = pool.filter((o) => o.variantId === v.id);
      const official = own.filter((o) => o.condition === "official");
      const unofficial = own.filter((o) => o.condition === "unofficial");
      return official.length && unofficial.length ? [{ label: v.label, official: lowest(official), unofficial: lowest(unofficial) }] : [];
    });
    const pick = pairs.sort((a, b) => a.official - b.official)[0];
    if (pick && pick.official > pick.unofficial) {
      faq.push({ q: t.faq.officialQ(name), a: t.faq.officialA(taka(pick.official), taka(pick.unofficial), taka(pick.official - pick.unofficial), many ? pick.label : null) });
    }
  }

  if (many) {
    const rows = product.variants.flatMap((v) => {
      const own = pool.filter((o) => o.variantId === v.id);
      return own.length ? [`${v.label}: ${taka(lowest(own))}`] : [];
    });
    if (rows.length > 1) faq.push({ q: t.faq.variantsQ(name), a: t.faq.variantsA(rows.join(", ")) });
  }

  const ids = new Set(offers.map((o) => o.id));
  const points = history.filter((p) => ids.has(p.offerId));
  if (points.length) {
    const low = points.reduce((a, b) => (b.price < a.price ? b : a));
    // build (UTC) আর ব্রাউজারে একই তারিখ, নইলে hydration এ অমিল
    const date = new Date(low.seenAt).toLocaleDateString(lang === "bn" ? "bn-BD" : "en-GB", { day: "numeric", month: "long", timeZone: "Asia/Dhaka" });
    faq.push({ q: t.faq.historyQ(name), a: low.price < best.price ? t.faq.historyA(taka(low.price), date, taka(best.price)) : t.faq.historyAtLow(taka(best.price)) });
  }
  return faq;
}
