import { closeBrowser } from "./lib/browser";
import { message } from "./lib/errors";
import { judge } from "./lib/judge";
import { llmReady } from "./lib/llm";
import { matchListing, type CatalogProduct } from "./lib/match";
import { readQuote } from "./stores/page";
import { stores } from "./stores";

const CATALOG: CatalogProduct[] = [
  {
    id: "p1",
    name: "Galaxy A17 5G",
    brand: "Samsung",
    variants: [
      { id: "p1v1", label: "6GB / 128GB" },
      { id: "p1v2", label: "8GB / 128GB" },
      { id: "p1v3", label: "8GB / 128GB Blue" },
    ],
  },
  { id: "p2", name: "Redmi Note 17 4G", brand: "Xiaomi", variants: [{ id: "p2v1", label: "8GB / 128GB" }, { id: "p2v2", label: "8GB / 256GB" }] },
  { id: "p4", name: "iPhone 17", brand: "Apple", variants: [{ id: "p4v1", label: "128GB" }, { id: "p4v2", label: "256GB" }] },
];

const LISTINGS = [
  "Samsung Galaxy A17 5G (8+128) Black",
  "Samsung Galaxy A17 5G 8GB/128GB Blue",
  "Samsung Galaxy A17 5G",
  "Galaxy A17 5G Smart View Clear Cover",
];

async function testStores() {
  console.log("-- দোকান থেকে দাম আর ছবি --");
  for (const store of stores) {
    try {
      const quote = await readQuote(store, store.sample, false);
      const parts = quote
        ? [`৳${quote.price}`, quote.oldPrice ? `(was ৳${quote.oldPrice})` : null, `via ${quote.via}`, quote.image ? `img ✓ ${quote.image.slice(0, 70)}` : "img ✗"]
        : ["no price found"]
            ;
      console.log(`${store.name.padEnd(14)} ${parts.filter(Boolean).join("  ")}`);
    } catch (error) {
      console.log(`${store.name.padEnd(14)} skipped: ${message(error)}`);
    }
  }
}

async function testMatcher() {
  console.log("\n-- লোকাল ম্যাচার (LLM ছাড়া) --");
  for (const listing of LISTINGS) {
    const match = matchListing(listing, CATALOG);
    console.log(`${listing.padEnd(42)} → ${match ? `${match.kind}: ${match.product.brand} ${match.product.name} [${(match.kind === "sure" ? [match.variant] : match.variants).map((v) => v.label).join(" / ")}]` : "কোনো পণ্যের সাথে মেলে না"}`);
  }
}

async function testLlm() {
  console.log("\n-- LLM বিচারপতি --");
  if (!(await llmReady())) {
    console.log("স্কিপ: LLM_API_KEY নেই। .env.local এ LLM_BASE_URL, LLM_MODEL, LLM_API_KEY বসিয়ে আবার চালান।");
    return;
  }
  for (const listing of LISTINGS.slice(0, 2)) {
    const match = matchListing(listing, CATALOG);
    if (!match) continue;
    const variants = match.kind === "sure" ? [match.variant] : match.variants;
    const verdict = await judge(listing, match.product, variants);
    console.log(`${listing.padEnd(42)} → ${verdict.variant ? verdict.variant.label : "null"} (${verdict.confidence}%) ${verdict.reason}`);
  }
}

async function main() {
  await testStores();
  await testMatcher();
  await testLlm();
  await closeBrowser();
}

main();
