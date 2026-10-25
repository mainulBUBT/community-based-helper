import { db, must } from "../lib/db";
import { message } from "../lib/errors";
import { toTaka } from "../lib/price";
import { upsertOffer } from "./offers";
import { approvedUnapplied, markApplied } from "./review";

// একটা সারি ভাঙলে বাকিগুলো থামে না; ভাঙা সারি পরের run এ আবার চেষ্টা হয়
export async function applyApproved(): Promise<{ applied: number; failed: string[] }> {
  const items = await approvedUnapplied();
  const failed: string[] = [];
  for (const { id, kind, payload } of items) {
    try {
      const price = toTaka(kind === "anomaly" ? payload.to : payload.price);
      const oldPrice = toTaka(payload.oldPrice);
      if (price && kind === "anomaly" && payload.offerId) {
        await must(db().from("offers").update({ price, old_price: oldPrice, checked_at: new Date().toISOString(), published: true }).eq("id", payload.offerId));
      } else if (price && payload.variantId && payload.sellerId) {
        await upsertOffer(
          { variantId: payload.variantId, sellerId: payload.sellerId, condition: payload.condition || "official", url: payload.url },
          { price, oldPrice, inStock: payload.inStock ? payload.inStock === "true" : null, key: payload.variantKey || undefined, region: payload.region || null },
        );
      }
      await markApplied(id);
    } catch (error) {
      failed.push(`${payload.product ?? payload.listing ?? id}: ${message(error)}`);
    }
  }
  return { applied: items.length - failed.length, failed };
}
