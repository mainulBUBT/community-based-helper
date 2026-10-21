import { bn } from "../lib/bn";
import { all, db, must } from "../lib/db";
import type { PageOffer } from "../lib/variants";
import { enqueue, pendingAnomaly } from "./review";

const JUMP = 0.6;
const MAX_IMAGES = 4;

interface VariantWithImages {
  product_id: string;
  products: { images: string[] | null } | null;
}

export async function saveProductImage(variantId: string, image: string | null) {
  if (!image || !/^https:\/\/[^\s"'<>]+$/i.test(image) || image.length > 1000) return;
  const row = await must(
    db().from("variants").select("product_id, products(images)").eq("id", variantId).maybeSingle<VariantWithImages>(),
  );
  const images = row?.products?.images ?? [];
  if (!row || images.includes(image) || images.length >= MAX_IMAGES) return;
  await must(db().from("products").update({ images: [...images, image] }).eq("id", row.product_id));
}

export interface TrackedOffer {
  id: string;
  variantId: string;
  sellerId: string;
  url: string;
  price: number;
  productLabel: string;
  sellerName: string;
}

export type SaveResult = "changed" | "same" | "anomaly";

export async function refreshOffer(offer: TrackedOffer, found: PageOffer): Promise<SaveResult> {
  const checked = { variant_key: found.key, checked_at: new Date().toISOString() };
  if (Math.abs(found.price - offer.price) / offer.price > JUMP) {
    if (!(await pendingAnomaly(offer.id))) {
      const change = Math.round(((found.price - offer.price) / offer.price) * 100);
      await enqueue("anomaly", {
        offerId: offer.id,
        url: offer.url,
        product: offer.productLabel,
        seller: offer.sellerName,
        from: String(offer.price),
        to: String(found.price),
        oldPrice: found.oldPrice ? String(found.oldPrice) : "",
        reason: `দাম ${bn(Math.abs(change))}% ${change > 0 ? "বেড়েছে" : "কমেছে"}, একবারে এতটা বদল সাধারণত হয় না`,
      });
    }
    await must(db().from("offers").update(checked).eq("id", offer.id));
    return "anomaly";
  }
  await must(
    db()
      .from("offers")
      .update({ ...checked, price: found.price, old_price: found.oldPrice, in_stock: found.inStock, ...(found.region ? { region: found.region } : {}) })
      .eq("id", offer.id),
  );
  return found.price === offer.price ? "same" : "changed";
}

export interface NewOffer {
  variantId: string;
  sellerId: string;
  condition: string;
  url: string;
}

export async function upsertOffer(target: NewOffer, found: Pick<PageOffer, "price" | "oldPrice" | "inStock"> & Partial<Pick<PageOffer, "key" | "region">>) {
  await must(
    db()
      .from("offers")
      .upsert(
        {
          variant_id: target.variantId,
          seller_id: target.sellerId,
          condition: target.condition,
          region: found.region ?? null,
          price: found.price,
          old_price: found.oldPrice,
          in_stock: found.inStock,
          url: target.url,
          variant_key: found.key ?? null,
          source: "site",
          published: true,
          checked_at: new Date().toISOString(),
        },
        { onConflict: "variant_id,seller_id,condition" },
      ),
  );
}

export async function markGone(offerIds: string[]) {
  await must(db().from("offers").update({ in_stock: false, checked_at: new Date().toISOString() }).in("id", offerIds));
}

export async function knownOfferUrls(): Promise<Set<string>> {
  const rows = await all<{ url: string }>((from, to) => db().from("offers").select("url").not("url", "is", null).range(from, to));
  return new Set(rows.map((r) => r.url));
}

export async function offerSlots(): Promise<Set<string>> {
  const rows = await all<{ variant_id: string; seller_id: string; condition: string }>((from, to) =>
    db().from("offers").select("variant_id, seller_id, condition").range(from, to),
  );
  return new Set(rows.map((r) => slot(r.variant_id, r.seller_id, r.condition)));
}

export const slot = (variantId: string, sellerId: string, condition: string) => `${variantId}|${sellerId}|${condition}`;
