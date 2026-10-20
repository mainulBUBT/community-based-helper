import { db, must } from "../lib/db";
import type { CatalogProduct } from "../lib/match";

interface Row {
  id: string;
  name: string;
  brand: string;
  variants: { id: string; label: string; position: number }[];
}

export async function loadCatalog(): Promise<CatalogProduct[]> {
  const rows = await must(db().from("products").select("id, name, brand, variants(id, label, position)"));
  return (rows as Row[]).map((p) => ({
    id: p.id,
    name: p.name,
    brand: p.brand,
    variants: [...p.variants].sort((a, b) => a.position - b.position).map(({ id, label }) => ({ id, label })),
  }));
}
