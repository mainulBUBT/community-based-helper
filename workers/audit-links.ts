import { readFileSync, writeFileSync } from "node:fs";
import { message, NoPrice } from "./lib/errors";
import { matchListing, packConflict, tokens } from "./lib/match";
import { groupBy, pool } from "./lib/pool";
import { place } from "./lib/variants";
import { readPage, type Page } from "./stores/page";
import { slugTitle, storeFor } from "./stores";

// সাইট-দোকান ভার্সন-অমিল যাচাই (ডিবি ছাড়া): ডাম্প ফাইলের প্রতিটা অফারের পাতা পড়ে দেখা
// পাতাটা আসলে আমাদের কোন পণ্য/ভার্সনের — কিছু লেখে না, শুধু রিপোর্ট দেয়।
// ডাম্প: `npx supabase db query --linked "select ... catalog, offers"` আউটপুট (site-shop কুয়েরি)।
// ব্যবহার: node --import tsx workers/audit-links.ts /tmp/dordam-site-shop.json [--slug-only] [--only=<domain>] [--limit=N]

interface CatalogRow {
  product_id: string;
  product_slug: string;
  product_name: string;
  brand: string;
  category: string | null;
  active: boolean;
  variant_id: string;
  variant_label: string;
  sku: string | null;
}

interface OfferRow {
  offer_id: string;
  url: string;
  price: number;
  condition: string;
  variant_id: string;
  variant_label: string;
  product_id: string;
  product_slug: string;
  product_name: string;
  brand: string;
  category: string | null;
  active: boolean;
  seller: string;
}

interface Product {
  id: string;
  name: string;
  brand: string;
  category: string | null;
  variants: { id: string; label: string; sku: string | null }[];
}

type Kind = "other" | "variant" | "none" | "ok";

interface Finding {
  kind: Kind;
  seller: string;
  url: string;
  product_slug: string;
  variant: string;
  title: string | null;
  matched: string | null;
  matchedVariant: string | null;
  score: number;
}

function load(path: string) {
  const raw = JSON.parse(readFileSync(path, "utf8")) as { rows: { catalog: CatalogRow[]; offers: OfferRow[] }[] };
  const { catalog, offers } = raw.rows[0];
  const products = new Map<string, Product>();
  for (const r of catalog) {
    let p = products.get(r.product_id);
    if (!p) products.set(r.product_id, (p = { id: r.product_id, name: r.product_name, brand: r.brand, category: r.category, variants: [] }));
    p.variants.push({ id: r.variant_id, label: r.variant_label, sku: r.sku });
  }
  return { products: [...products.values()], offers };
}

// ভার্সনের payload পড়ে দেখা: একই লিংকে JS দিয়ে ভার্সন বদলানো দোকানে (rule 12a) আমাদের ভার্সনের দাম payload-এ থাকে
function payloadHas(page: Page, url: string, product: Product, variantId: string, condition: string): boolean {
  const titles = [page.title ?? "", slugTitle(url)];
  return place(page.offers, product, titles, condition).some((spot) => spot.variants.some((v) => v.id === variantId));
}

function overlap(text: string, product: Product, label: string): number {
  const own = [...new Set([...tokens(product.name), ...tokens(label)])];
  const listed = new Set(tokens(text));
  return own.filter((t) => listed.has(t)).length / own.length;
}

function judge(page: Page | null, url: string, row: OfferRow, products: Product[], productsById: Map<string, Product>): Finding {
  const product = productsById.get(row.product_id)!;
  const base = { seller: row.seller, url, product_slug: row.product_slug, variant: row.variant_label, title: page?.title ?? null, matched: null, matchedVariant: null, score: 1 };
  const slug = slugTitle(url);
  const texts = [page?.title ?? "", slug].filter(Boolean).join(" ");
  const productMatch = page?.title ? matchListing(page.title, products) : null;
  const slugMatch = matchListing(slug, products);
  const match = productMatch ?? slugMatch;
  if (match && match.product.id !== row.product_id) {
    // শিরোনাম অন্য পণ্যের, স্লাগ আমাদের পণ্যের নামও ধারণ করছে না — তবেই নিশ্চিত অমিল
    const oursInSlug = tokens(product.name).every((t) => new Set(tokens(slug)).has(t));
    if (!oursInSlug || slugMatch?.product.id === match.product.id) {
      const matchedVariant = match.kind === "sure" ? match.variant.label : null;
      return { ...base, kind: "other", matched: `${match.product.name}`, matchedVariant, score: 0 };
    }
  }
  if (match && match.product.id === row.product_id) {
    const fitsOurs = match.kind === "sure" ? match.variant.id === row.variant_id : match.variants.some((v) => v.id === row.variant_id);
    if (fitsOurs && !packConflict(page?.title ?? slug, row.variant_label)) return { ...base, kind: "ok" };
    if (page && payloadHas(page, url, product, row.variant_id, row.condition)) return { ...base, kind: "ok" };
    const claimed = match.kind === "sure" ? match.variant.label : match.variants.map((v) => v.label).join(" | ");
    return { ...base, kind: "variant", matched: row.product_name, matchedVariant: claimed, score: overlap(texts, product, row.variant_label) };
  }
  return { ...base, kind: "none", matched: null, matchedVariant: null, score: overlap(texts, product, row.variant_label) };
}

async function main() {
  const args = process.argv.slice(2);
  const dumpPath = args.find((a) => !a.startsWith("--"));
  const slugOnly = args.includes("--slug-only");
  const only = args.find((a) => a.startsWith("--only="))?.slice(7)?.toLowerCase();
  const limitArg = args.find((a) => a.startsWith("--limit="))?.slice(8);
  const outPath = args.find((a) => a.startsWith("--out="))?.slice(6) ?? "/tmp/audit-links.jsonl";
  if (!dumpPath) {
    console.error("ডাম্প ফাইলের পথ লাগবে");
    process.exitCode = 1;
    return;
  }

  const { products, offers } = load(dumpPath);
  const productsById = new Map(products.map((p) => [p.id, p]));
  const rows = offers.filter((o) => !only || o.url.includes(only));
  const groups = [...groupBy(rows, (r) => r.url).entries()].slice(0, limitArg ? Number(limitArg) : undefined);
  const findings: Finding[] = [];
  const failed: string[] = [];
  const tally = new Map<string, Record<Kind | "noPrice", number>>();
  const total = groups.length;
  let done = 0;

  const perStore = groupBy(groups, ([url]) => storeFor(url).id);
  await Promise.all(
    [...perStore.values()].map((list) =>
      pool(list, 2, async ([url, group]) => {
        const store = storeFor(url);
        let page: Page | null = null;
        if (!slugOnly) {
          try {
            page = await readPage(store, url, false);
          } catch (error) {
            if (error instanceof NoPrice) {
              // দাম ঘোষণা নেই এমন পাতায় অমিল খোঁজার দরকার নেই
              const t = tally.get(store.name) ?? { other: 0, variant: 0, none: 0, ok: 0, noPrice: 0 };
              t.noPrice += group.length;
              tally.set(store.name, t);
              for (const o of group) findings.push({ kind: "ok", seller: o.seller, url, product_slug: o.product_slug, variant: o.variant_label, title: null, matched: null, matchedVariant: null, score: 1 });
              done++;
              return;
            }
            failed.push(`! ${store.name} ${url}: ${message(error)}`);
            done++;
            return;
          }
        }
        for (const row of group) {
          const f = judge(page, url, row, products, productsById);
          findings.push(f);
          const key = store.name;
          const t = tally.get(key) ?? { other: 0, variant: 0, none: 0, ok: 0, noPrice: 0 };
          t[f.kind]++;
          tally.set(key, t);
        }
        done++;
        if (done % 100 === 0) console.error(`${done}/${total} পাতা`);
      }),
    ),
  );

  const rank: Record<Kind, number> = { other: 0, variant: 1, none: 2, ok: 3 };
  const suspects = findings.filter((f) => f.kind !== "ok").sort((a, b) => rank[a.kind] - rank[b.kind] || a.score - b.score);
  writeFileSync(outPath, suspects.map((f) => JSON.stringify(f)).join("\n"));

  const sum = (k: Kind | "noPrice") => [...tally.values()].reduce((n, t) => n + (t[k] ?? 0), 0);
  console.log(`পাতা ${total}, অফার ${rows.length} — অন্য পণ্য ${sum("other")}, ভার্সন অমিল ${sum("variant")}, মেলেনি ${sum("none")}, দাম নেই ${sum("noPrice")}, ঠিক ${sum("ok")}, ব্যর্থ ${failed.length}`);
  console.log("\nদোকান                অন্য  ভার্সন  মেলেনি   ঠিক  দাম নেই");
  for (const [name, t] of [...tally].sort((a, b) => b[1].other + b[1].variant + b[1].none - (a[1].other + a[1].variant + a[1].none)))
    console.log(`${name.padEnd(20)} ${String(t.other).padStart(4)} ${String(t.variant).padStart(7)} ${String(t.none).padStart(7)} ${String(t.ok).padStart(6)} ${String(t.noPrice).padStart(8)}`);
  console.log(`\nসন্দেহজনক ${suspects.length}টা → ${outPath}`);
  if (failed.length) console.log(`\nপড়া যায়নি:\n${failed.slice(0, 40).join("\n")}`);
}

void main();
