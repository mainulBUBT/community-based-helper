import { message } from "./lib/errors";
import { metaContent, visibleText } from "./lib/html";
import { getText } from "./lib/http";
import { structuredQuote } from "./lib/price";
import { sitemapUrls } from "./lib/sitemap";
import { embeddedVariants, shopifyProduct, wooVariants } from "./stores/parsers";
import type { ShopVariant } from "./stores/types";

// নতুন দোকান কীভাবে পড়া যায়, নিজে খুঁজে বের করে: `npm run store:scan -- <ডোমেইন বা পণ্যের লিংক> [খোঁজার শব্দ]`
// robots, sitemap, পণ্যের পাতার path, আর কোন পথে দাম আসে (Shopify, WooCommerce, JSON-LD, পাতার ভেতরের JSON) দেখে
// workers/stores/index.ts-এর জন্য তৈরি এন্ট্রি দেখায়। DB লাগে না।
const SAMPLES = 3;
const PRODUCT_PATH = /^\/(products?|items?|shop|p)\/$/;

type Method = "shopify" | "woo" | "embedded" | "structured";
const PARSER: Record<Method, string | null> = { shopify: "product: shopifyProduct", woo: "variants: wooVariants", embedded: "variants: embeddedVariants", structured: null };

const show = (rows: ShopVariant[]) => rows.map((r) => `${r.options.join(" / ") || "—"}=${r.price}${r.oldPrice ? `(${r.oldPrice})` : ""}${r.inStock === false ? " স্টকে নেই" : ""}`).join(", ");

async function sitemapOf(origin: string): Promise<{ sitemap: string; urls: string[] } | null> {
  const robots = await getText(`${origin}/robots.txt`).catch(() => "");
  const listed = [...robots.matchAll(/^sitemap:\s*(\S+)/gim)].map(([, url]) => url);
  for (const sitemap of [...listed, `${origin}/sitemap_index.xml`, `${origin}/sitemap.xml`, `${origin}/product-sitemap.xml`]) {
    const urls = await sitemapUrls(sitemap).catch(() => []);
    if (urls.length) return { sitemap, urls };
  }
  return null;
}

function productPath(urls: string[], origin: string): { path: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const url of urls) {
    const { pathname, origin: own } = new URL(url);
    if (own.replace("://www.", "://") !== origin.replace("://www.", "://")) continue;
    const parts = pathname.split("/").filter(Boolean);
    const path = parts.length > 1 ? `/${parts[0]}/` : "/";
    counts.set(path, (counts.get(path) ?? 0) + 1);
  }
  return [...counts].map(([path, count]) => ({ path, count })).sort((a, b) => Number(PRODUCT_PATH.test(b.path)) - Number(PRODUCT_PATH.test(a.path)) || b.count - a.count);
}

async function readWith(url: string): Promise<{ method: Method | null; rows: ShopVariant[]; notes: string[] }> {
  const notes: string[] = [];
  if (/\/products\//.test(url)) {
    const own = await shopifyProduct(url).catch(() => null);
    if (own?.rows.length) return { method: "shopify", rows: own.rows, notes };
  }
  const html = await getText(url);
  const quote = structuredQuote(html);
  const woo = wooVariants(html);
  const embedded = embeddedVariants(html, url);
  notes.push(`JSON-LD/og: ${quote ? `${quote.price} (${quote.via})` : "নেই"}`, `Woo: ${woo.length ? show(woo) : "নেই"}`, `ভেতরের JSON: ${embedded.length ? show(embedded) : "নেই"}`);
  if (visibleText(html).length < 300 && !quote && !embedded.length) notes.push("HTML প্রায় খালি: JavaScript দিয়ে আঁকা, দাম পরে আসে");
  if (woo.length) return { method: "woo", rows: woo, notes };
  if (embedded.some((r) => r.options.length) || (!quote && embedded.length)) return { method: "embedded", rows: embedded, notes };
  if (quote) return { method: "structured", rows: [{ options: [], region: null, price: quote.price, oldPrice: quote.oldPrice, inStock: quote.inStock }], notes };
  return { method: null, rows: [], notes };
}

async function main() {
  const [input, word] = process.argv.slice(2).filter((a) => !a.startsWith("--"));
  if (!input) {
    console.error("ব্যবহার: npm run store:scan -- <ডোমেইন বা পণ্যের লিংক> [খোঁজার শব্দ]");
    process.exitCode = 1;
    return;
  }
  const start = new URL(/^https?:\/\//.test(input) ? input : `https://${input}`);
  const home = await getText(start.origin).catch((error) => {
    console.log(`✗ ${start.origin}: ${message(error)}`);
    return null;
  });
  if (home === null) return;
  const origin = start.origin;
  const name = metaContent(home, "og:site_name")?.trim() || start.hostname.replace(/^www\./, "");
  console.log(`দোকান: ${name} (${origin}), robots.txt-এ খোলা`);
  if (visibleText(home).length < 300) console.log("হোমপেজের HTML প্রায় খালি: JavaScript দিয়ে আঁকা সাইট, দাম সম্ভবত পরে আসে");

  const map = await sitemapOf(origin);
  const paths = map ? productPath(map.urls, origin) : [];
  console.log(map ? `sitemap: ${map.sitemap} (${map.urls.length}টা লিংক)` : "sitemap নেই: listing-এর জন্য ক্যাটাগরি পাতা ঘোরার কোড লাগবে");
  if (paths.length) console.log(`path: ${paths.slice(0, 5).map((p) => `${p.path} ${p.count}`).join(", ")}`);

  const path = paths[0]?.path ?? "/";
  const pool = (map?.urls ?? []).filter((url) => new URL(url).pathname.startsWith(path) && new URL(url).pathname !== path);
  const matching = word ? pool.filter((url) => url.toLowerCase().includes(word.toLowerCase())) : pool;
  const samples = start.pathname.length > 1 ? [start.href] : [...new Set([0, 0.5, 0.99].map((at) => matching[Math.floor(at * (matching.length - 1))]).filter(Boolean))].slice(0, SAMPLES);
  if (!samples.length) console.log(word ? `"${word}" লেখা কোনো পণ্যের লিংক নেই` : "নমুনা পণ্যের লিংক পাওয়া যায়নি; পণ্যের লিংক দিয়ে আবার চালান");

  const methods: Method[] = [];
  for (const url of samples) {
    try {
      const { method, rows, notes } = await readWith(url);
      if (method) methods.push(method);
      console.log(`\n${method ? "✓" : "✗"} ${url}\n  ${notes.join("\n  ")}\n  ফল: ${method ? `${method} → ${show(rows)}` : "দাম পড়া যায়নি"}`);
    } catch (error) {
      console.log(`\n! ${url}: ${message(error)}`);
    }
  }

  const best = (["shopify", "woo", "embedded", "structured"] as const).find((m) => methods.includes(m));
  if (!best) {
    console.log("\nসাধারণ worker-এ পড়া যায় না। উপায়: দোকানের feed/API চাওয়া, অথবা scripts/special-stores.ts (ব্রাউজার)।");
    return;
  }
  const id = start.hostname.replace(/^www\./, "").split(".")[0].replace(/[^a-z0-9]/g, "");
  const lines = [
    `  id: "${id}",`,
    `  name: "${name}",`,
    `  origin: "${origin}",`,
    `  sample: "${samples[0]}",`,
    map ? `  sitemap: "${map.sitemap}",` : `  sitemap: "", // নেই: discover নিজে লিখতে হবে`,
    `  path: "${path}",${path === "/" ? " // পণ্যের পাতা রুটে, তাই match দিয়ে ক্যাটাগরি পাতা বাদ দিন" : ""}`,
    `  condition: "official", // দোকান দেখে মিলিয়ে নিন`,
    ...(PARSER[best] ? [`  ${PARSER[best]},`] : []),
  ];
  console.log(`\nworkers/stores/index.ts-এ:\nsitemapStore({\n${lines.join("\n")}\n}),`);
}

void main();
