import { all, db } from "../lib/db";
import { slot } from "./offers";

export interface ShopOffers {
  slots: Set<string>;
  urls: Set<string>;
}

// শুধু এই বিক্রেতার দাম; প্রতিটা দোকানের worker আলাদা চলে, তাই পুরো offers টেবিল বারবার পড়া হয় না
export async function shopOffers(sellerId: string): Promise<ShopOffers> {
  const rows = await all<{ variant_id: string; condition: string; url: string | null }>((from, to) =>
    db().from("offers").select("variant_id, condition, url").eq("seller_id", sellerId).order("id").range(from, to),
  );
  return {
    slots: new Set(rows.map((r) => slot(r.variant_id, sellerId, r.condition))),
    urls: new Set(rows.flatMap((r) => (r.url ? [r.url] : []))),
  };
}
