import { db, must } from "../lib/db";
import { toTaka } from "../lib/price";
import { upsertOffer } from "./offers";
import { approvedUnapplied, markApplied } from "./review";

export async function applyApproved(): Promise<number> {
  const items = await approvedUnapplied();
  for (const { id, kind, payload } of items) {
    const price = toTaka(kind === "anomaly" ? payload.to : payload.price);
    if (price && payload.variantId && payload.sellerId) {
      await upsertOffer(
        { variantId: payload.variantId, sellerId: payload.sellerId, url: payload.url, productLabel: "", sellerName: "" },
        { price, oldPrice: toTaka(payload.oldPrice), inStock: payload.inStock ? payload.inStock === "true" : null },
      );
    } else if (price && payload.offerId) {
      await must(db().from("offers").update({ price, checked_at: new Date().toISOString() }).eq("id", payload.offerId));
    }
    await markApplied(id);
  }
  return items.length;
}
