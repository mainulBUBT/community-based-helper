import { all, db, must } from "../lib/db";
import type { CatalogProduct, CatalogVariant } from "../lib/match";

export interface CatalogEntry extends CatalogProduct {
  pending: boolean;
  variants: (CatalogVariant & { officialPrice: number | null })[];
}

interface Row {
  id: string;
  name: string;
  brand: string;
  category: string | null;
  discover_requested_at: string;
  discovered_at: string | null;
  variants: { id: string; label: string; position: number; official_price: number | null }[];
}

export async function loadCatalog(): Promise<CatalogEntry[]> {
  const rows = await all<Row>((from, to) =>
    db().from("products").select("id, name, brand, category, discover_requested_at, discovered_at, variants(id, label, position, official_price)").order("id").range(from, to),
  );
  return rows.map((p) => ({
    id: p.id,
    name: p.name,
    brand: p.brand,
    category: p.category,
    pending: !p.discovered_at || p.discovered_at < p.discover_requested_at,
    variants: [...p.variants].sort((a, b) => a.position - b.position).map(({ id, label, official_price }) => ({ id, label, officialPrice: official_price })),
  }));
}

// run শুরুর সময় বসে, তাই run চলাকালীন যোগ হওয়া ভার্সন পরের বারও খোঁজা হয়
export async function markDiscovered(productIds: string[], startedAt: string) {
  for (let i = 0; i < productIds.length; i += 200) {
    await must(db().from("products").update({ discovered_at: startedAt }).in("id", productIds.slice(i, i + 200)));
  }
}
