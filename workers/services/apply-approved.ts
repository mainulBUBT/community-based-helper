import { db, must } from "../lib/db";
import { toTaka } from "../lib/price";
import { upsertOffer } from "./offers";
import { approvedUnapplied, markApplied } from "./review";

export async function applyApproved(): Promise<number> {
  const items = await approvedUnapplied();
  for (const { id, kind, payload } of items) {
    const price = toTaka(kind === "anomaly" ? payload.to : payload.price);
    const oldPrice = toTaka(payload.oldPrice);
    if (price && kind === "anomaly" && payload.offerId) {
      await must(db().from("offers").update({ price, old_price: oldPrice, checked_at: new Date().toISOString() }).eq("id", payload.offerId));
    } else if (price && payload.variantId && payload.sellerId) {
      await upsertOffer(
        { variantId: payload.variantId, sellerId: payload.sellerId, condition: payload.condition || "official", url: payload.url },
        { price, oldPrice, inStock: payload.inStock ? payload.inStock === "true" : null, key: payload.variantKey || undefined, region: payload.region || null },
      );
    }
    await markApplied(id);
  }
  return items.length;
}
