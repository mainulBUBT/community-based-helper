import { db, must } from "../lib/db";
import { message } from "../lib/errors";
import { toTaka } from "../lib/price";
import { upsertOffer } from "./offers";
import { approvedUnapplied, markApplied } from "./review";

// এই দোকানের এই ভার্সনে অন্য লিংকের দাম আগে থেকে থাকলে (অ্যাডমিনের হাতে বসানোও হতে পারে) সেটা চুপচাপ বদলানো হয় না
async function takenBy(variantId: string, sellerId: string, condition: string): Promise<string | null> {
  const rows = await must(db().from("offers").select("url").eq("variant_id", variantId).eq("seller_id", sellerId).eq("condition", condition).limit(1));
  return (rows ?? []).length ? ((rows![0] as { url: string | null }).url ?? "") : null;
}

// একটা সারি ভাঙলে বাকিগুলো থামে না; ভাঙা সারি পরের run এ আবার চেষ্টা হয়
export async function applyApproved(): Promise<{ applied: number; failed: string[]; kept: string[] }> {
  const items = await approvedUnapplied();
  const failed: string[] = [];
  const kept: string[] = [];
  for (const { id, kind, payload } of items) {
    try {
      const price = toTaka(kind === "anomaly" ? payload.to : payload.price);
      const oldPrice = toTaka(payload.oldPrice);
      if (price && kind === "anomaly" && payload.offerId) {
        await must(db().from("offers").update({ price, old_price: oldPrice, checked_at: new Date().toISOString(), published: true }).eq("id", payload.offerId));
      } else if (price && payload.variantId && payload.sellerId) {
        const condition = payload.condition || "official";
        const existing = await takenBy(payload.variantId, payload.sellerId, condition);
        if (existing !== null && existing !== payload.url) {
          kept.push(payload.listing ?? id);
          await markApplied(id);
          continue;
        }
        await upsertOffer(
          { variantId: payload.variantId, sellerId: payload.sellerId, condition, url: payload.url },
          { price, oldPrice, inStock: payload.inStock ? payload.inStock === "true" : null, key: payload.variantKey || undefined, region: payload.region || null },
        );
      }
      await markApplied(id);
    } catch (error) {
      failed.push(`${payload.product ?? payload.listing ?? id}: ${message(error)}`);
    }
  }
  return { applied: items.length - failed.length - kept.length, failed, kept };
}
