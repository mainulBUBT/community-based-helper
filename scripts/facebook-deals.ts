// ফেসবুক পোস্টারের জন্য ডেটা: /tmp/dordam-poster ডাম্প থেকে recentDrops (গত ৭ দিন)
import { readFileSync, writeFileSync } from "node:fs";
import { recentDrops } from "../src/utils/catalog";
import { summarize } from "../src/services/catalog-core";
import type { Offer, PricePoint, Product } from "../src/types/catalog";

const DIR = "/tmp/dordam-poster";
const rows = <T>(name: string): T[] => JSON.parse(readFileSync(`${DIR}/${name}`, "utf8")).rows as T[];

interface RawProduct {
  id: string; slug: string; name: string; brand: string; category: string;
  popularity: number; images: string[] | null; active: boolean;
  variants: { id: string; label: string | null; official_price: number | null; attributes: Record<string, unknown> | null }[];
}
interface RawOffer {
  id: string; variant_id: string; seller_id: string; price: number;
  old_price: number | null; in_stock: boolean | null; condition: string; published: boolean; seller_name: string | null;
}
interface RawPoint { offer_id: string; price: number; seen_at: string }

const toVariant = (v: RawProduct["variants"][number]) => ({
  id: v.id, label: v.label ?? "", officialPrice: v.official_price, attributes: v.attributes ?? {}, position: 0,
});

const products = rows<RawProduct>("products.json").filter((p) => p.active).map((p) => ({
  id: p.id, slug: p.slug, name: p.name, brand: p.brand, category: p.category,
  releaseYear: null, popularity: p.popularity ?? 0, images: p.images ?? [], variants: p.variants.map(toVariant),
} as unknown as Product));

const variantCategory = new Map<string, string>();
for (const p of products) for (const v of p.variants) variantCategory.set(v.id, p.category);

const offers = rows<RawOffer>("offers.json")
  .filter((o) => o.published !== false && variantCategory.has(o.variant_id))
  .map((o) => ({
    id: o.id, variantId: o.variant_id, sellerId: o.seller_id, price: o.price,
    oldPrice: o.old_price, inStock: o.in_stock, condition: o.condition, region: null,
    url: "", source: "", published: true, checkedAt: "", expiresAt: null,
  } as unknown as Offer));

const history = rows<RawPoint>("history.json").map((h) => ({
  offerId: h.offer_id, price: h.price, seenAt: h.seen_at,
} as PricePoint));

const catalog = { categories: [], sellers: [], promos: [], products, offers } as never;
const summaries = products.map((p) => summarize(catalog, p));

const drops = recentDrops(summaries, offers, history, 7);
const dropByProduct = new Map(drops.map((d) => [d.productId, d]));

const out = summaries.map((s) => {
  const drop = dropByProduct.get(s.product.id);
  if (!drop) return null;
  const lowestOffer = offers
    .filter((o) => s.product.variants.some((v) => v.id === o.variantId) && o.inStock !== false)
    .sort((a, b) => a.price - b.price)[0];
  const seller = lowestOffer ? rows<RawOffer>("offers.json").find((o) => o.id === lowestOffer.id) : null;
  return {
    slug: s.product.slug,
    name: s.product.name,
    brand: s.product.brand,
    category: s.product.category,
    image: s.product.images?.[0] ?? null,
    lowest: s.lowest,
    from: drop.from,
    amount: drop.amount,
    daysAgo: drop.daysAgo,
    sellerCount: s.sellerCount,
    seller: seller?.seller_name ?? null,
  };
}).flatMap((d) => (d ? [d] : []));

// ডিল: ‍সব ক্যাটাগরি, বড় বাদে সব;-proof হিসেবে সবগুলো JSON-এ
writeFileSync(`${DIR}/drops.json`, JSON.stringify(out, null, 2));

console.log(`drops: ${out.length}`);
for (const d of out.slice(0, 40)) console.log(`${d.category} | ${d.brand} ${d.name} | ৳${d.lowest} (আগে ৳${d.from}) | ${d.daysAgo}d | ${d.sellerCount} shops | ${d.seller}`);
