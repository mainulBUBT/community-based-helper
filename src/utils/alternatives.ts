import type { Alternative, Axis, Condition, Offer, Product, ProductSummary, Variant } from "@/types/catalog";
import { numericValue, sizeInGb } from "@/utils/variants";

export interface AlternativeCandidate {
  product: Product;
  summary: ProductSummary;
  offers: Offer[];
}

export interface AlternativeInput {
  current: Product;
  currentVariant: Variant;
  currentOffers: Offer[];
  candidates: AlternativeCandidate[];
  axes: readonly Axis[];
  limit?: number;
}

// অন্য ধরনের পণ্য অনেক সস্তা হলে সেটা আলাদা স্তরের পণ্য, তুলনা করা ঠিক হবে না
const MIN_PRICE_RATIO = 0.25;

const gap = (axis: Axis, a: string, b: string) => {
  if (axis === "ram" || axis === "storage") return sizeInGb(a) - sizeInGb(b);
  if (axis === "capacity" || axis === "battery" || axis === "wattage") return numericValue(a) - numericValue(b);
  return null;
};

const present = (variant: Variant, axes: readonly Axis[]) => axes.filter((axis) => variant.attributes[axis]);

// "একই স্পেক" শুধু তখনই, যখন ভাগের সব ঘর দুই ভার্সনেই আছে আর সব এক
const sameAxes = (mine: Variant, theirs: Variant, axes: readonly Axis[]) => {
  if (!axes.length) return false;
  if (present(mine, axes).length !== axes.length) return false;
  if (present(theirs, axes).length !== axes.length) return false;
  return axes.every((axis) => theirs.attributes[axis] === mine.attributes[axis]);
};

const notWorse = (mine: Variant, theirs: Variant, axes: readonly Axis[]) =>
  axes.every((axis) => {
    const a = mine.attributes[axis];
    const b = theirs.attributes[axis];
    if (!a || !b) return true;
    const diff = gap(axis, b, a);
    return diff === null ? true : diff >= 0;
  });

// স্টকে থাকা দাম আগে, না থাকলে যেটা আছে তা দেখাও (site এর lowestOffer এর মতো)
const priceFor = (offers: Offer[], variantId: string, condition: Condition | "any") => {
  const scoped = offers.filter((offer) => offer.variantId === variantId);
  const pool = condition === "any" ? scoped : scoped.filter((offer) => offer.condition === condition);
  if (!pool.length) return null;
  const inStock = pool.filter((offer) => offer.inStock !== false);
  const usable = inStock.length ? inStock : pool;
  const best = usable.reduce((low, offer) => (offer.price < low.price ? offer : low));
  return { price: best.price, condition: best.condition, stores: new Set(usable.map((offer) => offer.sellerId)).size };
};

export function findCheaperAlternatives({
  current,
  currentVariant,
  currentOffers,
  candidates,
  axes,
  limit = 4,
}: AlternativeInput): Alternative[] {
  const mine = currentOffers.filter((offer) => offer.variantId === currentVariant.id);
  if (!mine.length) return [];
  const basis: Condition | "any" = mine.some((offer) => offer.condition === "official") ? "official" : "any";
  const myVariantPrice = priceFor(mine, currentVariant.id, basis);
  if (!myVariantPrice) return [];

  const exact = new Map<string, Alternative>();
  const similar = new Map<string, Alternative>();

  for (const candidate of candidates) {
    if (candidate.product.id === current.id) continue;
    for (const theirVariant of candidate.product.variants) {
      const sameSpec = sameAxes(currentVariant, theirVariant, axes);
      if (!sameSpec && !notWorse(currentVariant, theirVariant, axes)) continue;

      // একই ভার্সনের দামই মিলিয়ে দেখি, তাই তুলনা ঠিক থাকে
      const theirPrice = priceFor(candidate.offers, theirVariant.id, basis);
      if (!theirPrice || theirPrice.price >= myVariantPrice.price) continue;
      if (!sameSpec && theirPrice.price < myVariantPrice.price * MIN_PRICE_RATIO) continue;

      const saving = myVariantPrice.price - theirPrice.price;
      const bucket = sameSpec ? exact : similar;
      const existing = bucket.get(candidate.product.id);
      if (existing && existing.saving >= saving) continue;
      bucket.set(candidate.product.id, {
        summary: candidate.summary,
        variantId: theirVariant.id,
        specLabel: sameSpec ? theirVariant.label : "",
        sameSpec,
        price: theirPrice.price,
        saving,
        condition: theirPrice.condition,
        stores: theirPrice.stores,
      });
    }
  }

  const merged = new Map(exact);
  for (const [id, alternative] of similar) if (!merged.has(id)) merged.set(id, alternative);
  const all = [...merged.values()];
  return [
    // একই স্পেক: সবচেয়ে বেশি সাশ্রয় আগে। একই ধরনের: সবচেয়ে সস্তা আগে।
    ...all.filter((a) => a.sameSpec).sort((a, b) => b.saving - a.saving),
    ...all.filter((a) => !a.sameSpec).sort((a, b) => a.price - b.price),
  ].slice(0, limit);
}
