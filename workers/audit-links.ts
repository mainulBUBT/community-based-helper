import { appendFileSync, existsSync, readFileSync } from "node:fs";
import { message, NoPrice } from "./lib/errors";
import { matchListing, packConflict, tokens } from "./lib/match";
import { groupBy, pool } from "./lib/pool";
import { candidates, place, type PageOffer } from "./lib/variants";
import { readPage, type Page } from "./stores/page";
import { slugTitle, storeFor } from "./stores";

// সাইট-দোকান ভার্সন-অমিল যাচাই (ডিবি ছাড়া, কিছু লেখে না)।
// এক লিংকে JS দিয়ে ভার্সন বদলানো পাতায় (rule 12a) শিরোনাম নয়, পাতার payload আর অফারের বাঁধা অপশন (variant_key) দেখা হয়।
// প্রতিটা পাতার ফল সাথে সাথে --out ফাইলে যায়; আবার চালালে আগে পড়া পাতা বাদ দিয়ে বাকিটা পড়ে।
// ব্যবহার: node --import tsx workers/audit-links.ts <dump.json> --out=<file.jsonl> [--slug-only] [--only=<domain>] [--limit=N]

interface CatalogRow {
  product_id: string;
  product_name: string;
  brand: string;
  category: string | null;
  variant_id: string;
  variant_label: string;
  sku: string | null;
}

interface OfferRow {
  offer_id: string;
  url: string;
  price: number;
  condition: string;
  variant_key: string | null;
  variant_id: string;
  variant_label: string;
  product_id: string;
  product_slug: string;
  product_name: string;
  seller: string;
}

interface Product {
  id: string;
  name: string;
  brand: string;
  category: string | null;
  variants: { id: string; label: string; sku: string | null }[];
}

type Kind = "other" | "variant" | "bound" | "missing" | "shared" | "rebind" | "none" | "ok";

interface Finding {
  kind: Kind;
  offer_id: string;
  seller: string;
  url: string;
  product_slug: string;
  variant: string;
  price: number;
  key: string | null;
  title: string | null;
  toggle: boolean;
  matched: string | null;
  pageOption: string | null;
  pagePrice: number | null;
}

interface PageRecord {
  url: string;
  store: string;
  status: "read" | "noPrice" | "failed";
  error?: string;
  findings: Finding[];
}

const LABEL: Record<Kind, string> = {
  other: "অন্য পণ্য",
  variant: "ভার্সন অমিল",
  bound: "ভুল অপশনে বাঁধা",
  missing: "বাঁধা অপশন নেই",
  shared: "এক অপশনে দুই ভার্সন",
  rebind: "পরের রানে নিজে ঠিক হবে",
  none: "মেলেনি",
  ok: "ঠিক",
};
const RANK: Record<Kind, number> = { other: 0, bound: 1, shared: 2, variant: 3, missing: 4, none: 5, rebind: 6, ok: 7 };

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

const hasOptions = (page: Page) => page.offers.some((o) => o.label);

function otherProduct(page: Page | null, url: string, row: OfferRow, products: Product[]): string | null {
  const slug = slugTitle(url);
  const titleMatch = page?.title ? matchListing(page.title, products) : null;
  const slugMatch = matchListing(slug, products);
  const match = titleMatch ?? slugMatch;
  if (!match || match.product.id === row.product_id) return null;
  const slugTokens = new Set(tokens(slug));
  const oursInSlug = tokens(row.product_name).every((t) => slugTokens.has(t));
  if (oursInSlug && slugMatch?.product.id !== match.product.id) return null;
  return match.kind === "sure" ? `${match.product.name} ${match.variant.label}` : match.product.name;
}

// এক লিংকে অনেক ভার্সন: বাঁধা অপশনটা পাতায় আছে কি না, আর সেটা সত্যিই আমাদের ভার্সনের স্পেকে মেলে কি না
function judgeToggle(page: Page, row: OfferRow, product: Product, alone: boolean): Pick<Finding, "kind" | "pageOption" | "pagePrice"> {
  const target = { product: product.name, label: row.variant_label, siblings: product.variants.map((v) => v.label), condition: row.condition, price: row.price };
  const show = (o: PageOffer | undefined) => ({ pageOption: o?.label || o?.key || null, pagePrice: o?.price ?? null });
  if (row.variant_key) {
    const [bound] = candidates(page.offers, { ...target, key: row.variant_key }, alone);
    if (!bound || bound.key !== row.variant_key) return { kind: bound ? "rebind" : "missing", ...show(bound) };
    const fits = candidates([bound], { ...target, key: null }, alone).length > 0;
    return { kind: fits ? "ok" : "bound", ...show(bound) };
  }
  const [found] = candidates(page.offers, { ...target, key: null }, alone);
  return { kind: found ? "ok" : "variant", ...show(found) };
}

// ভার্সন-প্রতি আলাদা পাতা: শিরোনাম (না পেলে লিংক) থেকে সাইজ/ভার্সন
function judgePlain(page: Page | null, url: string, row: OfferRow, product: Product, products: Product[]): Kind {
  const text = page?.title ?? slugTitle(url);
  const match = matchListing(text, products) ?? matchListing(slugTitle(url), products);
  if (!match || match.product.id !== row.product_id) return "none";
  const fitsOurs = match.kind === "sure" ? match.variant.id === row.variant_id : match.variants.some((v) => v.id === row.variant_id);
  if (fitsOurs && !packConflict(text, row.variant_label)) return "ok";
  if (page && place(page.offers, product, [page.title ?? "", slugTitle(url)], row.condition).some((s) => s.variants.some((v) => v.id === row.variant_id))) return "ok";
  return "variant";
}

function judgeGroup(page: Page | null, url: string, group: OfferRow[], products: Product[], productsById: Map<string, Product>): Finding[] {
  const toggle = !!page && hasOptions(page);
  const findings = group.map((row): Finding => {
    const product = productsById.get(row.product_id)!;
    const base = { offer_id: row.offer_id, seller: row.seller, url, product_slug: row.product_slug, variant: row.variant_label, price: row.price, key: row.variant_key, title: page?.title ?? null, toggle, matched: null, pageOption: null, pagePrice: null };
    const other = otherProduct(page, url, row, products);
    if (other) return { ...base, kind: "other", matched: other };
    if (toggle) return { ...base, ...judgeToggle(page, row, product, group.length === 1) };
    return { ...base, kind: judgePlain(page, url, row, product, products), pagePrice: page?.offers[0]?.price ?? null };
  });
  const keyCount = groupBy(
    group.filter((r) => r.variant_key),
    (r) => `${r.product_id} ${r.variant_key}`,
  );
  for (const f of findings) {
    const row = group.find((r) => r.offer_id === f.offer_id)!;
    const shared = row.variant_key && (keyCount.get(`${row.product_id} ${row.variant_key}`)?.length ?? 0) > 1;
    if (shared && f.kind === "ok") f.kind = "shared";
  }
  return findings;
}

function readDone(path: string): Map<string, PageRecord> {
  const done = new Map<string, PageRecord>();
  if (!existsSync(path)) return done;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    if (!line.trim()) continue;
    const record = JSON.parse(line) as PageRecord;
    if (record.status !== "failed") done.set(record.url, record);
  }
  return done;
}

function report(records: PageRecord[], total: number) {
  const tally = new Map<string, Record<Kind | "noPrice" | "failed", number>>();
  const empty = () => ({ other: 0, variant: 0, bound: 0, missing: 0, shared: 0, rebind: 0, none: 0, ok: 0, noPrice: 0, failed: 0 });
  for (const r of records) {
    const t = tally.get(r.store) ?? empty();
    if (r.status === "read") for (const f of r.findings) t[f.kind]++;
    else t[r.status]++;
    tally.set(r.store, t);
  }
  const sum = (k: keyof ReturnType<typeof empty>) => [...tally.values()].reduce((n, t) => n + t[k], 0);
  const kinds = Object.keys(LABEL) as Kind[];
  console.log(`পাতা ${records.length}/${total} — ${kinds.map((k) => `${LABEL[k]} ${sum(k)}`).join(", ")}, দাম নেই ${sum("noPrice")} পাতা, ব্যর্থ ${sum("failed")} পাতা`);
  const bad = (t: ReturnType<typeof empty>) => t.other + t.variant + t.bound + t.missing + t.shared + t.none;
  console.log(`\n${"দোকান".padEnd(22)}${kinds.map((k) => k.padStart(8)).join("")}  noPrice  failed`);
  for (const [name, t] of [...tally].filter(([, t]) => bad(t) || t.failed).sort((a, b) => bad(b[1]) - bad(a[1])))
    console.log(`${name.padEnd(22)}${kinds.map((k) => String(t[k]).padStart(8)).join("")}${String(t.noPrice).padStart(9)}${String(t.failed).padStart(8)}`);
  const suspects = records.flatMap((r) => r.findings).filter((f) => f.kind !== "ok");
  console.log(`\nসন্দেহজনক অফার ${suspects.length}টা`);
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
  const done = slugOnly ? new Map<string, PageRecord>() : readDone(outPath);
  const records = [...done.values()].filter((r) => groups.some(([url]) => url === r.url));
  const todo = groups.filter(([url]) => !done.has(url));
  console.error(`আগে পড়া ${groups.length - todo.length}, বাকি ${todo.length} পাতা`);
  let count = 0;

  const save = (record: PageRecord) => {
    records.push(record);
    if (!slugOnly) appendFileSync(outPath, `${JSON.stringify(record)}\n`);
    if (++count % 100 === 0) console.error(`${count}/${todo.length} পাতা`);
  };

  await Promise.all(
    [...groupBy(todo, ([url]) => storeFor(url).id).values()].map((list) =>
      pool(list, 2, async ([url, group]) => {
        const store = storeFor(url);
        let page: Page | null = null;
        if (!slugOnly) {
          try {
            page = await readPage(store, url, false);
          } catch (error) {
            save({ url, store: store.name, status: error instanceof NoPrice ? "noPrice" : "failed", error: message(error), findings: [] });
            return;
          }
        }
        save({ url, store: store.name, status: "read", findings: judgeGroup(page, url, group, products, productsById) });
      }),
    ),
  );

  report(records, groups.length);
  const suspects = records.flatMap((r) => r.findings).filter((f) => f.kind !== "ok").sort((a, b) => RANK[a.kind] - RANK[b.kind]);
  if (slugOnly) for (const f of suspects.slice(0, 60)) console.log(`${LABEL[f.kind]} | ${f.seller} | ${f.product_slug} ${f.variant} | ${f.url}`);
}

void main();
