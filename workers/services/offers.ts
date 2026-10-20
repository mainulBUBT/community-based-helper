import { bn } from "../lib/bn";
import { db, must } from "../lib/db";
import type { Quote } from "../lib/price";
import { enqueue, pendingAnomaly } from "./review";

const JUMP = 0.6;

export interface OfferTarget {
  variantId: string;
  sellerId: string;
  url: string;
  productLabel: string;
  sellerName: string;
}

export type SaveResult = "new" | "changed" | "same" | "anomaly";

interface ExistingOffer {
  id: string;
  price: number;
}

async function existing(target: OfferTarget): Promise<ExistingOffer | null> {
  return must(
    db()
      .from("offers")
      .select("id, price")
      .eq("variant_id", target.variantId)
      .eq("seller_id", target.sellerId)
      .eq("condition", "official")
      .maybeSingle(),
  );
}

export async function upsertOffer(target: OfferTarget, quote: Pick<Quote, "price" | "oldPrice" | "inStock">) {
  await must(
    db()
      .from("offers")
      .upsert(
        {
          variant_id: target.variantId,
          seller_id: target.sellerId,
          condition: "official",
          price: quote.price,
          old_price: quote.oldPrice,
          in_stock: quote.inStock,
          url: target.url,
          source: "site",
          published: true,
          checked_at: new Date().toISOString(),
        },
        { onConflict: "variant_id,seller_id,condition" },
      ),
  );
}

export async function saveQuote(target: OfferTarget, quote: Quote): Promise<SaveResult> {
  const prior = await existing(target);
  if (prior && Math.abs(quote.price - prior.price) / prior.price > JUMP) {
    if (!(await pendingAnomaly(prior.id))) {
      const change = Math.round(((quote.price - prior.price) / prior.price) * 100);
      await enqueue("anomaly", {
        offerId: prior.id,
        variantId: target.variantId,
        sellerId: target.sellerId,
        url: target.url,
        product: target.productLabel,
        seller: target.sellerName,
        from: String(prior.price),
        to: String(quote.price),
        oldPrice: quote.oldPrice ? String(quote.oldPrice) : "",
        reason: `দাম ${bn(Math.abs(change))}% ${change > 0 ? "বেড়েছে" : "কমেছে"}, একবারে এতটা বদল সাধারণত হয় না`,
      });
    }
    await must(db().from("offers").update({ checked_at: new Date().toISOString() }).eq("id", prior.id));
    return "anomaly";
  }
  await upsertOffer(target, quote);
  if (!prior) return "new";
  return prior.price === quote.price ? "same" : "changed";
}

export async function markGone(offerId: string) {
  await must(db().from("offers").update({ in_stock: false, checked_at: new Date().toISOString() }).eq("id", offerId));
}

export async function knownOfferUrls(): Promise<Set<string>> {
  const rows = await must(db().from("offers").select("url").not("url", "is", null));
  return new Set((rows as { url: string }[]).map((r) => r.url));
}
