import { db, must } from "../lib/db";
import type { Store } from "../stores/types";

const bare = (url: string) => new URL(url).host.replace(/^www\./, "");

export interface SellerRef {
  id: string;
  name: string;
}

export async function sellersByStore(stores: Store[]): Promise<Map<string, SellerRef>> {
  const rows = await must(db().from("sellers").select("id, name, website").eq("active", true).not("website", "is", null));
  const map = new Map<string, SellerRef>();
  for (const store of stores) {
    const row = (rows as { id: string; name: string; website: string }[]).find((r) => bare(r.website) === bare(store.origin));
    if (row) map.set(store.id, { id: row.id, name: row.name });
  }
  return map;
}
