import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { promisify } from "node:util";
import type { Offer, Product, Seller } from "../../src/types/catalog";
import { all, db, must } from "../lib/db";
import { count } from "../jobs/summary";
import { ensureSellers } from "./sellers";

const exec = promisify(execFile);
const FILE = "src/data/catalog.generated.ts";
const CHUNK = 500;

interface Snapshot {
  catalogSellers: Seller[];
  catalogProducts: Product[];
  catalogOffers: Offer[];
}

// Postgres-এর md5(text)::uuid, seed.sql-এর মতোই id
const uuid = (text: string) => createHash("md5").update(text).digest("hex").replace(/^(.{8})(.{4})(.{4})(.{4})(.{12})$/, "$1-$2-$3-$4-$5");
const host = (url: string) => new URL(url).host.replace(/^www\./, "");
const offerKey = (o: Offer) => `${o.variantId}|${o.sellerId}|${o.condition}`;
const chunks = <T>(rows: T[]) => Array.from({ length: Math.ceil(rows.length / CHUNK) }, (_, i) => rows.slice(i * CHUNK, (i + 1) * CHUNK));

async function git(...args: string[]) {
  return (await exec("git", args, { maxBuffer: 256 * 1024 * 1024 })).stdout;
}

async function snapshot(commit: string, dir: string): Promise<Snapshot> {
  const file = join(dir, `${commit}.ts`);
  await writeFile(file, await git("show", `${commit}:${FILE}`));
  return (await import(pathToFileURL(file).href)) as Snapshot;
}

async function insert(table: string, rows: object[], onConflict: string) {
  for (const part of chunks(rows)) await must(db().from(table).upsert(part, { onConflict, ignoreDuplicates: true }));
}

async function idsBy(table: string, column: string, values: string[]): Promise<Map<string, string>> {
  const found = new Map<string, string>();
  for (const part of chunks(values)) {
    const rows = (await must(db().from(table).select(`id, ${column}`).in(column, part))) as unknown as Record<string, string>[];
    for (const row of rows) found.set(row[column], row.id);
  }
  return found;
}

// শেষ সিঙ্কের commit থেকে এখন পর্যন্ত catalog JSON-এ যা নতুন যোগ হয়েছে (দোকান, পণ্য, ভার্সন, দাম), শুধু সেটুকু DB-তে; db:seed-এর মতোই
// আগে থাকা সারি বদলায় না। শুধু নতুনটুকু বলে অ্যাডমিনে মোছা পুরনো পণ্য বা দাম আবার ফেরে না
export async function syncCatalog(): Promise<string> {
  const head = (await git("rev-parse", "HEAD")).trim();
  const row = await must(db().from("private_settings").select("catalog_commit").eq("id", true).maybeSingle<{ catalog_commit: string | null }>());
  const base = row?.catalog_commit ?? null;
  if (base === head) return "";
  const saveMark = () => must(db().from("private_settings").update({ catalog_commit: head }).eq("id", true));
  if (!base) {
    await saveMark();
    return "ক্যাটালগ সিঙ্কের শুরু এই commit থেকে";
  }
  const ahead = await exec("git", ["merge-base", "--is-ancestor", base, head]).then(() => true, () => false);
  if (!ahead) return `ক্যাটালগ সিঙ্ক হয়নি: শেষ সিঙ্কের commit ${base.slice(0, 7)} এই checkout-এর ইতিহাসে নেই`;

  const dir = await mkdtemp(join(tmpdir(), "catalog-"));
  try {
    const [before, now] = await Promise.all([snapshot(base, dir), snapshot(head, dir)]);
    const oldSellers = new Set(before.catalogSellers.map((s) => s.id));
    const oldSlugs = new Set(before.catalogProducts.map((p) => p.slug));
    const oldVariants = new Set(before.catalogProducts.flatMap((p) => p.variants.map((v) => v.id)));
    const oldOffers = new Set(before.catalogOffers.map(offerKey));

    const sellers = now.catalogSellers.filter((s) => s.website && !oldSellers.has(s.id));
    const products = now.catalogProducts.filter((p) => !oldSlugs.has(p.slug));
    const variants = now.catalogProducts.flatMap((p) => p.variants.flatMap((v, position) => (oldVariants.has(v.id) ? [] : [{ product: p, variant: v, position }])));
    const offers = now.catalogOffers.filter((o) => !oldOffers.has(offerKey(o)));

    const addedSellers = await ensureSellers(sellers.map((s) => ({ name: s.name, website: s.website as string, verified: s.verified })));
    await insert(
      "products",
      products.map((p) => ({
        id: uuid(`product:${p.slug}`),
        slug: p.slug,
        name: p.name,
        brand: p.brand,
        category: p.category,
        release_year: p.releaseYear,
        popularity: p.popularity,
        images: p.images ?? [],
        colors: p.colors ?? [],
        regions: p.regions ?? [],
        specs: p.specs ?? [],
        specs_source: p.specsSource ?? null,
      })),
      "slug",
    );
    const productIds = await idsBy("products", "slug", [...new Set(variants.map(({ product }) => product.slug))]);
    await insert(
      "variants",
      variants.flatMap(({ product, variant, position }) => {
        const productId = productIds.get(product.slug);
        return productId ? [{ id: uuid(`variant:${variant.id}`), product_id: productId, label: variant.label, attributes: variant.attributes, official_price: variant.officialPrice, position }] : [];
      }),
      "id",
    );

    const sellerIds = new Map<string, string>();
    for (const s of await all<{ id: string; website: string }>((from, to) => db().from("sellers").select("id, website").not("website", "is", null).order("created_at").range(from, to))) {
      if (!sellerIds.has(host(s.website))) sellerIds.set(host(s.website), s.id);
    }
    const variantIds = new Set((await idsBy("variants", "id", [...new Set(offers.map((o) => uuid(`variant:${o.variantId}`)))])).values());
    const offerRows = offers.flatMap((o) => {
      const variantId = uuid(`variant:${o.variantId}`);
      const sellerId = sellerIds.get(o.sellerId);
      if (!sellerId || !variantIds.has(variantId)) return [];
      return [{ variant_id: variantId, seller_id: sellerId, condition: o.condition, region: o.region, price: o.price, old_price: o.oldPrice, in_stock: o.inStock, url: o.url, source: "site", checked_at: o.checkedAt }];
    });
    await insert("offers", offerRows, "variant_id,seller_id,condition");
    await saveMark();

    const parts = [
      addedSellers && count(addedSellers, "দোকান"),
      products.length && count(products.length, "পণ্য"),
      variants.length && count(variants.length, "ভার্সন"),
      offerRows.length && count(offerRows.length, "দাম"),
    ].filter(Boolean);
    return parts.length ? `ক্যাটালগ থেকে নতুন: ${parts.join(", ")}` : "";
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
