import { db, must } from "../lib/db";
import type { SellerDelivery } from "../../src/types/catalog";
import type { Store } from "../stores/types";

const bare = (url: string) => new URL(url).host.replace(/^www\./, "");

export interface SellerRef {
  id: string;
  name: string;
  discoveredAt: string | null;
}

export interface NewSeller {
  name: string;
  website: string;
  verified?: boolean;
}

type SellerRow = { id: string; name: string; website: string; discovered_at: string | null };
const ref = (row: SellerRow): SellerRef => ({ id: row.id, name: row.name, discoveredAt: row.discovered_at });

async function activeSellers(): Promise<SellerRow[]> {
  return (await must(db().from("sellers").select("id, name, website, discovered_at").eq("active", true).not("website", "is", null))) as SellerRow[];
}

export async function sellersByStore(stores: Store[]): Promise<Map<string, SellerRef>> {
  const rows = await activeSellers();
  const map = new Map<string, SellerRef>();
  for (const store of stores) {
    const row = rows.find((r) => bare(r.website) === bare(store.origin));
    if (row) map.set(store.id, ref(row));
  }
  return map;
}

// কনফিগ থাকা দোকান নিজের কনফিগে; বাকি সক্রিয় বিক্রেতা (অ্যাডমিনে শুধু ওয়েবসাইট দিয়ে যোগ করা) সাধারণ দোকান হয়ে
export async function storesWithSellers(stores: Store[], generic: (website: string, name: string) => Store): Promise<{ store: Store; seller: SellerRef }[]> {
  const pairs = new Map<string, { store: Store; seller: SellerRef }>();
  for (const row of await activeSellers()) {
    const store = stores.find((s) => bare(s.origin) === bare(row.website)) ?? generic(row.website, row.name);
    if (!pairs.has(store.id)) pairs.set(store.id, { store, seller: ref(row) });
  }
  return [...pairs.values()];
}

// নেই এমন ডোমেইনের বিক্রেতা বানায়; নিষ্ক্রিয় করা সারি থাকলে ছোঁয় না
export async function ensureSellers(list: NewSeller[]): Promise<number> {
  const rows = (await must(db().from("sellers").select("website").not("website", "is", null))) as { website: string }[];
  const known = new Set(rows.map((r) => bare(r.website)));
  const missing = [...new Map(list.filter((s) => !known.has(bare(s.website))).map((s) => [bare(s.website), s])).values()];
  if (missing.length === 0) return 0;
  await must(db().from("sellers").insert(missing.map((s) => ({ name: s.name, kind: "website", website: s.website, verified: s.verified ?? true }))));
  return missing.length;
}

// দোকানের run শুরুর সময়; এর পরে চাওয়া পণ্যই পরের বার এই দোকানে খোঁজা হয়
export async function markStoreDiscovered(sellerId: string, startedAt: string) {
  await must(db().from("sellers").update({ discovered_at: startedAt }).eq("id", sellerId));
}

export type DeliverySource = "page" | "ai";
type StoredSource = DeliverySource | "admin";

export type FoundDelivery = Partial<SellerDelivery>;

interface StoredDelivery extends SellerDelivery {
  source?: StoredSource;
  checkedAt?: string;
  draft?: FoundDelivery;
}

const EMPTY: SellerDelivery = { dhaka: null, outside: null, minDays: null, maxDays: null, cod: null, returnDays: null };
const savedDelivery = new Set<string>();
const values = (d: FoundDelivery | null | undefined): FoundDelivery =>
  Object.fromEntries(Object.keys(EMPTY).flatMap((key) => (d?.[key as keyof SellerDelivery] != null ? [[key, d[key as keyof SellerDelivery]]] : [])));
const same = (a: unknown, b: unknown) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

export async function storedDelivery(sellerId: string): Promise<StoredDelivery | null> {
  const row = await must(db().from("sellers").select("delivery").eq("id", sellerId).maybeSingle<{ delivery: StoredDelivery | null }>());
  return row?.delivery ?? null;
}

// পাতার গোছানো ডেটা (shippingDetails) সরাসরি বসে আর AI-এর পড়াকে ছাপিয়ে যায়। AI-এর নতুন পড়া আগে খসড়া হয়,
// পরের বার একই এলে তবেই সাইটে; দোকান প্রতি এক run-এ একবার। হাতে বসানো বাকি ঘর থেকে যায়
export async function saveDelivery(sellerId: string, found: FoundDelivery, source: DeliverySource) {
  if (savedDelivery.has(sellerId)) return;
  savedDelivery.add(sellerId);
  const current = await storedDelivery(sellerId);
  if (current?.source === "admin" || (source === "ai" && current?.source === "page")) return;
  const fresh = values(found);
  const shown = values(current);
  const next = { ...EMPTY, ...shown, ...fresh };
  const checkedAt = new Date().toISOString();
  if (source === "ai" && !same(values(next), shown) && !same(current?.draft, fresh)) {
    await must(db().from("sellers").update({ delivery: { ...EMPTY, ...shown, source: current?.source, checkedAt, draft: fresh } }).eq("id", sellerId));
    return;
  }
  if (source === "page" && current?.source === "page" && same(values(next), shown)) return;
  await must(db().from("sellers").update({ delivery: { ...next, source, checkedAt } }).eq("id", sellerId));
}
