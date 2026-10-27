import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { createServer, type Server } from "node:http";
import { AddressInfo } from "node:net";
import { chromium, type BrowserContext, type Page } from "playwright";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { jsonLd, metaContent } from "../workers/lib/html";

const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

interface BakedProduct {
  id: string;
  slug: string;
  name: string;
  brand: string;
  images: string[];
  variants: { id: string }[];
}

interface Plan {
  product: BakedProduct;
  broken: string[];
  keep: string[];
  added: string[];
  source?: string;
}

function loadCatalog() {
  const products: BakedProduct[] = [];
  const offersByVariant = new Map<string, string[]>();
  for (const file of readdirSync("public/data/catalog")) {
    if (!file.endsWith(".json") || file === "specs.json") continue;
    const data = JSON.parse(readFileSync(`public/data/catalog/${file}`, "utf8"));
    for (const p of data.products ?? []) {
      products.push({ ...p, images: p.images ?? [] });
      for (const v of p.variants ?? []) offersByVariant.set(v.id, []);
    }
    for (const o of data.offers ?? []) {
      if (o.url && offersByVariant.has(o.variantId)) offersByVariant.get(o.variantId)!.push(o.url);
    }
  }
  return { products, offersByVariant };
}

function offerUrls(p: BakedProduct, offersByVariant: Map<string, string[]>) {
  const urls = p.variants.flatMap((v) => offersByVariant.get(v.id) ?? []);
  return [...new Set(urls)].slice(0, 5);
}

async function imageOk(ctx: BrowserContext, url: string): Promise<boolean> {
  // সত্যিকারের <img> লোড দিয়েই যাচাই — CDN-গুলো request-API আর img-তে আলাদা ব্যবহার করে।
  const page = await verifyPage(ctx);
  return (await page.evaluate(
    `new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img.naturalWidth > 0);
      img.onerror = () => resolve(false);
      setTimeout(() => resolve(false), 15000);
      img.src = ${JSON.stringify(url)};
    })`,
  )) as boolean;
}

let verifyPort: number | null = null;
let verifyPagePromise: Promise<Page> | null = null;

// খালি লোকাল পাতা — ছবি লোড-টেস্টের উৎস referer হিসেবে সাইটের মতো পরের ডোমেইন লাগে।
async function startVerifyServer(): Promise<number> {
  const server: Server = createServer((_req, res) => {
    res.writeHead(200, { "content-type": "text/html" });
    res.end("<!doctype html><title>img-check</title>");
  });
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  verifyPort = (server.address() as AddressInfo).port;
  return verifyPort;
}

function verifyPage(ctx: BrowserContext) {
  verifyPagePromise ??= (async () => {
    const port = verifyPort ?? (await startVerifyServer());
    const page = await ctx.newPage();
    // ছবির অনুরোধে সাইটের আসল referer পাঠানো হয় — CDN ব্লকলিস্ট তাতেই ধরা পড়ে।
    await page.route(/^https?:\/\//i, (route) =>
      route.continue({ headers: { ...route.request().headers(), referer: "https://dordam.app/" } }),
    );
    await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: "domcontentloaded" });
    return page;
  })();
  return verifyPagePromise;
}

async function collectCandidates(ctx: BrowserContext, url: string) {
  const page = await ctx.newPage();
  const found: string[] = [];
  try {
    const res = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30_000 });
    if (!res || res.status() >= 400) return found;
    const html = await page.content();
    for (const ld of jsonLd(html) as Array<Record<string, unknown>>) {
      if (ld["@type"] !== "Product") continue;
      const img = ld.image;
      if (typeof img === "string") found.push(img);
      else if (Array.isArray(img)) found.push(...img.filter((i): i is string => typeof i === "string"));
    }
    const og = metaContent(html, "og:image");
    if (og) found.push(og);
    const dom = await page
      .evaluate(() =>
        Array.from(
          document.querySelectorAll<HTMLElement>(
            ".woocommerce-product-gallery__image img, .product-image img, #image, .main-image img, .pdp-image img, [data-gallery] img, .product-single__gallery img, .details-book-main-img img",
          ),
        )
          .map((el) => (el as HTMLImageElement).src)
          .filter(Boolean),
      )
      .catch(() => [] as string[]);
    found.push(...dom);
  } catch {
    // পাতা না খুললে পরের দোকান
  } finally {
    await page.close();
  }
  return [...new Set(found)].map((u) => new URL(u, url).href).filter((u) => u.startsWith("http"));
}

function host(u: string) {
  try {
    return new URL(u).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function bare(u: string) {
  try {
    const { origin, pathname } = new URL(u);
    return origin + pathname;
  } catch {
    return u;
  }
}

// Shopify ইত্যাদিতে একই ছবি ভিন্ন CDN ঠিকানায় থাকে; শেষ অংশের নাম মিললে ডুপ্লিকেট।
function fileName(u: string) {
  const parts = bare(u).split("/");
  return /\.[a-z0-9]{3,5}$/i.test(parts.at(-1) || "") ? parts.at(-1) : null;
}

// https সাইটে http ছবি mixed-content হয়ে ব্লক হয়, তাই https রূপেই রাখা হয়।
async function imageOkSecure(ctx: BrowserContext, url: string) {
  const secure = url.startsWith("http://") ? url.replace(/^http:/, "https:") : url;
  return (await imageOk(ctx, secure)) ? secure : null;
}

async function main() {
  const apply = process.argv.includes("--apply");
  const { products, offersByVariant } = loadCatalog();
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ userAgent: USER_AGENT });

  console.log(`১) ${products.length} পণ্যের ছবির লিংক ব্রাউজার দিয়ে যাচাই হচ্ছে…`);
  const allUrls = [...new Set(products.flatMap((p) => p.images))];
  const okCache = new Map<string, boolean>();
  for (let i = 0; i < allUrls.length; i += 12) {
    await Promise.all(
      allUrls.slice(i, i + 12).map(async (u) => {
        okCache.set(u, await imageOk(ctx, u));
      }),
    );
  }
  const damaged = products
    .map((p) => ({ p, broken: p.images.filter((u) => !okCache.get(u)) }))
    .filter((x) => x.broken.length > 0);
  console.log(`   ভাঙা লিংক ${damaged.reduce((n, x) => n + x.broken.length, 0)}টা, পণ্য ${damaged.length}টা`);

  console.log("২) দোকানের পাতা থেকে নতুন ছবি আনা হচ্ছে…");
  const plans: Plan[] = [];
  for (const { p, broken } of damaged) {
    const keep = p.images.filter((u) => okCache.get(u));
    const urls = offerUrls(p, offersByVariant);
    const preferred = [
      ...urls.filter((u) => broken.some((b) => host(b) === host(u))),
      ...urls.filter((u) => !broken.some((b) => host(b) === host(u))),
    ];
    const added: string[] = [];
    let source: string | undefined;
    for (const pageUrl of preferred) {
      const candidates = await collectCandidates(ctx, pageUrl);
      const seen = new Set([...keep, ...added].map(bare));
      const names = new Set([...keep, ...added].map(fileName).filter(Boolean));
      for (const c of candidates) {
        if (added.length + keep.length >= 5) break;
        if (seen.has(bare(c))) continue;
        const name = fileName(c);
        if (name && names.has(name)) continue;
        const okUrl = await imageOkSecure(ctx, c);
        if (!okUrl) continue;
        seen.add(bare(okUrl));
        if (fileName(okUrl)) names.add(fileName(okUrl)!);
        added.push(okUrl);
        source = source ?? pageUrl;
      }
      if (added.length > 0 && added.length + keep.length >= 2) break;
    }
    plans.push({ product: p, broken, keep, added, source });
    const mark = keep.length + added.length > 0 ? "✅" : "⚠️ নতুন ছবি পাওয়া যায়নি";
    console.log(`   ${mark} ${p.brand} ${p.name} — বাদ ${broken.length}, রাখা ${keep.length}, নতুন ${added.length}`);
  }

  if (!apply) {
    console.log("\nশুকনো ফল (dry run) — DB বদলানো হয়নি। তালিকা:");
    for (const plan of plans) {
      console.log(`\n${plan.product.brand} ${plan.product.name} [${plan.product.slug}]`);
      for (const b of plan.broken) console.log(`  বাদ:   ${b}`);
      for (const a of plan.added) console.log(`  নতুন: ${a} (${plan.source})`);
    }
    await browser.close();
    return;
  }

  console.log("\n৩) Supabase আর data/catalog হালনাগাদ হচ্ছে…");
  const sb: SupabaseClient | null =
    process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY
      ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY, {
          auth: { persistSession: false, autoRefreshToken: false },
        })
      : null;
  if (!sb) throw new Error("SUPABASE_URL / SUPABASE_SERVICE_KEY নেই");

  for (const plan of plans) {
    if (plan.keep.length + plan.added.length === 0) continue;
    const images = [...plan.keep, ...plan.added];
    const { error } = await sb.from("products").update({ images }).eq("id", plan.product.id);
    if (error) {
      console.log(`   ❌ DB: ${plan.product.slug} — ${error.message}`);
      continue;
    }
    for (const file of readdirSync("data/catalog")) {
      if (!file.endsWith(".json") || file === "specs.json") continue;
      const path = `data/catalog/${file}`;
      const text = readFileSync(path, "utf8");
      if (!plan.broken.some((b) => text.includes(b))) continue;
      const data = JSON.parse(text);
      const indent = [2, 1].find((i) => JSON.stringify(data, null, i) === text.trimEnd()) ?? 1;
      let dirty = false;
      for (const p of data.products ?? []) {
        if (!Array.isArray(p.images) || !plan.broken.some((b) => p.images.includes(b))) continue;
        p.images = images;
        dirty = true;
      }
      if (!dirty) continue;
      const newline = text.endsWith("\n") ? "\n" : "";
      writeFileSync(path, JSON.stringify(data, null, indent) + newline);
    }
    console.log(`   ✅ ${plan.product.slug}: এখন ${images.length}টা ছবি`);
  }

  await browser.close();
  console.log("\nশেষ। সাইটে দেখতে: npm run build:data");
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
