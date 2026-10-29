import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { NoPrice, message } from "./lib/errors";
import { groupBy, pool } from "./lib/pool";
import { candidates, place, single } from "./lib/variants";
import { readPage, type Page } from "./stores/page";
import { slugTitle, storeFor } from "./stores";

// ডেটাবেস ছাড়া যাচাই: data/catalog এর প্রতিটা দাম worker নিজে পড়ে মেলাতে পারে কি না
const DIR = "data/catalog";

interface Row {
  product: string;
  variant: string;
  siblings: string[];
  site: string;
  url: string;
  price: number;
  condition: string;
}

function rows(): Row[] {
  return readdirSync(DIR)
    .filter((f) => f.endsWith(".json") && f !== "specs.json")
    .flatMap((f) => {
      const batch = JSON.parse(readFileSync(join(DIR, f), "utf8")) as {
        products: { name: string; variants: { label: string }[]; offers: Omit<Row, "product" | "siblings">[] }[];
      };
      return batch.products.flatMap((p) => p.offers.map((o) => ({ ...o, product: p.name, siblings: p.variants.map((v) => v.label) })));
    });
}

function placed(page: Page, o: Row, url: string) {
  const product = { id: o.product, name: o.product, brand: "", variants: o.siblings.map((label) => ({ id: label, label })) };
  const spot = place(page.offers, product, [page.title ?? "", slugTitle(url)], o.condition).find((p) => p.variants.some((v) => v.label === o.variant));
  return spot?.variants.length === 1 ? single(spot.found) : null;
}

// --new: আগের দাম না জেনে মেলানো, যেমন নতুন পণ্য খোঁজার সময় হয়
async function main() {
  const fresh = process.argv.includes("--new");
  const filter = process.argv.slice(2).find((a) => !a.startsWith("--"))?.toLowerCase();
  const all = rows().filter((r) => !filter || r.url.includes(filter) || r.product.toLowerCase().includes(filter));
  const tally = new Map<string, { ok: number; moved: number; missing: number; failed: number; noPrice: number }>();
  const problems: string[] = [];
  const groups = [...groupBy(all, (r) => r.url).entries()];
  const perStore = [...groupBy(groups, ([url]) => storeFor(url).id).values()];

  await Promise.all(perStore.map((list) => pool(list, 2, async ([url, offers]) => {
    const store = storeFor(url);
    const count = tally.get(store.name) ?? { ok: 0, moved: 0, missing: 0, failed: 0, noPrice: 0 };
    tally.set(store.name, count);
    try {
      const page = await readPage(store, url, false);
      for (const o of offers) {
        const target = { product: o.product, label: o.variant, siblings: o.siblings, condition: o.condition, price: o.price };
        const found = !page ? null : fresh ? placed(page, o, url) : single(candidates(page.offers, target, offers.length === 1));
        if (!found) {
          count.missing++;
          problems.push(`✗ ${o.product} ${o.variant} @ ${o.site}: মেলেনি [${page?.offers.map((p) => `${p.label || "—"}=${p.price}`).join(", ") ?? "দাম নেই"}] ${url}`);
        } else if (found.price === o.price) count.ok++;
        else {
          count.moved++;
          problems.push(`~ ${o.product} ${o.variant} @ ${o.site}: ${o.price} → ${found.price} (${found.label || "—"}) ${url}`);
        }
      }
    } catch (error) {
      // দোকান নিজেই দাম দেখায় না: prices এটাকে "স্টকে নেই" করে, সিঙ্ক ভাঙে না; তবে নতুন দাম হিসেবে যোগ করা চলবে না
      if (error instanceof NoPrice) {
        count.noPrice += offers.length;
        problems.push(`০ ${offers[0].site} ${url}: দাম ঘোষণা নেই (To be announced)`);
        return;
      }
      count.failed += offers.length;
      problems.push(`! ${offers[0].site} ${url}: ${message(error)}`);
    }
  })));

  console.log(problems.sort().join("\n"));
  console.log("\nদোকান              ঠিক  বদলেছে  মেলেনি  ব্যর্থ  দাম নেই");
  for (const [name, c] of [...tally].sort()) console.log(`${name.padEnd(18)} ${String(c.ok).padStart(4)} ${String(c.moved).padStart(7)} ${String(c.missing).padStart(7)} ${String(c.failed).padStart(6)} ${String(c.noPrice).padStart(7)}`);
  const bad = [...tally.values()].reduce((n, c) => n + c.missing + c.failed, 0);
  console.log(`\nমোট ${all.length}টা দাম, ${bad}টা সিঙ্ক হবে না`);
  process.exitCode = bad ? 1 : 0;
}

main();
