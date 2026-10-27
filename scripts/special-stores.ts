import { chromium, type Browser, type BrowserContext, type Page } from "playwright";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { toTaka } from "../workers/lib/price";
import { jsonLd, metaContent } from "../workers/lib/html";

export interface SpecialStoreQuote {
  storeId: string;
  storeName: string;
  url: string;
  title: string | null;
  price: number | null;
  oldPrice: number | null;
  inStock: boolean | null;
  image: string | null;
  via: string;
  platform?: string;
  timestamp: string;
}

export interface StoreProbeResult {
  id: string;
  name: string;
  sampleUrl: string;
  httpStatus: number | null;
  browserStatus: number | null;
  title: string | null;
  price: number | null;
  method: string;
  accessible: boolean;
  notes: string;
}

export interface SpecialStoreConfig {
  id: string;
  name: string;
  hosts: string[];
  sampleUrl: string;
  strategy: "direct_or_browser" | "browser_stealth" | "playwright_datalayer";
  extract: (page: Page, html: string, url: string) => Promise<Partial<SpecialStoreQuote>>;
}

const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

export function detectPlatform(html: string): string {
  if (html.includes("wp-content") || html.includes("woocommerce")) return "WooCommerce";
  if (html.includes("cdn.shopify.com") || html.includes("Shopify.theme")) return "Shopify";
  if (html.includes("route=product") || html.includes("catalog/view/theme")) return "OpenCart";
  if (html.includes("__NEXT_DATA__") || html.includes("/_next/")) return "Next.js";
  if (html.includes("__NUXT__") || html.includes("/_nuxt/")) return "Nuxt.js";
  if (html.includes("data-reactroot")) return "React";
  return "Standard Web / Schema.org";
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function universalExtract(page: Page, html: string, _url: string): Promise<Partial<SpecialStoreQuote>> {
  const platform = detectPlatform(html);

  // 1. Try Schema.org JSON-LD (Supported by 90%+ modern e-commerce sites)
  for (const ld of jsonLd(html) as Array<Record<string, unknown>>) {
    if (ld["@type"] === "Product" || ld["@type"] === "Book") {
      const offer = (ld.offers || {}) as Record<string, unknown>;
      const p = toTaka(offer.price ?? offer.lowPrice);
      if (p) {
        return {
          title: (ld.name as string) || null,
          price: p,
          oldPrice: toTaka(offer.highPrice ?? null),
          inStock: offer.availability ? String(offer.availability).includes("InStock") : null,
          image: typeof ld.image === "string" ? ld.image : null,
          via: `${platform.toLowerCase()}-jsonld`,
          platform,
        };
      }
    }
  }

  // 2. OpenGraph & Microdata
  const ogPrice = metaContent(html, "product:price:amount") || metaContent(html, "og:price:amount");
  const ogTitle = metaContent(html, "og:title");
  const ogImage = metaContent(html, "og:image");

  // 3. Platform-specific DOM inspection
  const domData = await page.evaluate(() => {
    const titleEl = document.querySelector("h1.product_title, h1.product-title, h1.title, h1, .pdp-title");
    const saleEl = document.querySelector(".price ins .woocommerce-Price-amount, .price-new, .special-price, .product-price, .final-price");
    const regEl = document.querySelector(".price del .woocommerce-Price-amount, .price-old, .old-price, .regular-price");
    const singlePrice = document.querySelector(".woocommerce-Price-amount, .price, .pr-dv .price");
    const stockEl = document.querySelector(".stock, .availability, .btn-out-of-stock, .out-of-stock");
    const imgEl = document.querySelector(".woocommerce-product-gallery__image img, .product-image img, #image, .main-image img");

    const isOutOfStock = stockEl ? /out of stock|stock out|not available/i.test(stockEl.textContent || "") : false;

    return {
      title: titleEl?.textContent?.trim() || null,
      price: saleEl?.textContent?.trim() || singlePrice?.textContent?.trim() || null,
      oldPrice: regEl?.textContent?.trim() || null,
      inStock: !isOutOfStock,
      image: (imgEl as HTMLImageElement)?.src || null,
    };
  }).catch(() => null);

  const price = toTaka(domData?.price) || toTaka(ogPrice);

  return {
    title: domData?.title || ogTitle || null,
    price,
    oldPrice: toTaka(domData?.oldPrice),
    inStock: domData?.inStock ?? null,
    image: domData?.image || ogImage || null,
    via: `${platform.toLowerCase()}-dom`,
    platform,
  };
}

export const SPECIAL_STORES: Record<string, SpecialStoreConfig> = {
  ryans: {
    id: "ryans",
    name: "Ryans Computers",
    hosts: ["ryans.com", "www.ryans.com", "ryanscomputers.com"],
    sampleUrl: "https://www.ryans.com",
    strategy: "browser_stealth",
    async extract(page, html) {
      for (const ld of jsonLd(html) as Array<Record<string, unknown>>) {
        if (ld["@type"] === "Product" && ld.offers) {
          const offer = ld.offers as Record<string, unknown>;
          return {
            title: typeof ld.name === "string" ? ld.name : null,
            price: toTaka(offer.price),
            inStock: String(offer.availability).includes("InStock"),
            via: "json-ld",
          };
        }
      }

      const data = await page.evaluate(() => {
        const title = document.querySelector("h1.title, h1.product-title, h1")?.textContent?.trim() || null;
        const price = document.querySelector(".pr-dv .price, .special-price, .regular-price, .price-box .price")?.textContent?.trim() || null;
        const oldPrice = document.querySelector(".old-price, .regular-price-old")?.textContent?.trim() || null;
        const stockText = document.querySelector(".stock, .availability")?.textContent?.trim() || "";
        const image = (document.querySelector(".product-image img, .carousel-item img") as HTMLImageElement)?.src || null;
        return {
          title,
          price,
          oldPrice,
          inStock: stockText ? /in stock|available/i.test(stockText) : null,
          image,
        };
      }).catch(() => null);

      return {
        title: data?.title || null,
        price: toTaka(data?.price),
        oldPrice: toTaka(data?.oldPrice),
        inStock: data?.inStock ?? null,
        image: data?.image || null,
        via: "ryans-dom",
      };
    },
  },

  techland: {
    id: "techland",
    name: "TechLand BD",
    hosts: ["techlandbd.com", "www.techlandbd.com"],
    sampleUrl: "https://www.techlandbd.com",
    strategy: "browser_stealth",
    async extract(page) {
      const data = await page.evaluate(() => {
        const title = document.querySelector("h1#title-page, h1.title, h1")?.textContent?.trim() || null;
        const priceNew = document.querySelector(".price-new, .price .special-price, .price")?.textContent?.trim() || null;
        const priceOld = document.querySelector(".price-old")?.textContent?.trim() || null;
        const stockEl = document.querySelector(".stock, .product-stock, .reward")?.textContent || "";
        const image = (document.querySelector(".thumbnail img, #image") as HTMLImageElement)?.src || null;
        return {
          title,
          price: priceNew,
          oldPrice: priceOld,
          inStock: stockEl ? !/out of stock|stock out/i.test(stockEl) : null,
          image,
        };
      }).catch(() => null);

      return {
        title: data?.title || null,
        price: toTaka(data?.price),
        oldPrice: toTaka(data?.oldPrice),
        inStock: data?.inStock ?? null,
        image: data?.image || null,
        via: "techland-opencart",
      };
    },
  },

  pickaboo: {
    id: "pickaboo",
    name: "Pickaboo",
    hosts: ["pickaboo.com", "www.pickaboo.com"],
    sampleUrl: "https://www.pickaboo.com",
    strategy: "direct_or_browser",
    async extract(page) {
      const data = await page.evaluate(() => {
        const title = document.querySelector("h1.product-title, h1, .product-name")?.textContent?.trim() || null;
        const price = document.querySelector(".product-price, .special-price, .final-price, .price")?.textContent?.trim() || null;
        const oldPrice = document.querySelector(".old-price, .original-price")?.textContent?.trim() || null;
        const stockBtn = document.querySelector(".add-to-cart, .btn-cart, .buy-now")?.textContent || "";
        const image = (document.querySelector(".product-gallery img, .main-image img") as HTMLImageElement)?.src || null;
        return {
          title,
          price,
          oldPrice,
          inStock: stockBtn ? !/out of stock|sold out/i.test(stockBtn) : null,
          image,
        };
      }).catch(() => null);

      return {
        title: data?.title || null,
        price: toTaka(data?.price),
        oldPrice: toTaka(data?.oldPrice),
        inStock: data?.inStock ?? null,
        image: data?.image || null,
        via: "pickaboo-dom",
      };
    },
  },

  gadstyle: {
    id: "gadstyle",
    name: "GadStyle",
    hosts: ["gadstyle.com", "www.gadstyle.com"],
    sampleUrl: "https://www.gadstyle.com",
    strategy: "direct_or_browser",
    async extract(page) {
      const data = await page.evaluate(() => {
        const title = document.querySelector("h1.product_title, h1")?.textContent?.trim() || null;
        const ins = document.querySelector(".price ins .woocommerce-Price-amount")?.textContent?.trim();
        const price = ins || document.querySelector(".price .woocommerce-Price-amount, .price")?.textContent?.trim() || null;
        const oldPrice = document.querySelector(".price del .woocommerce-Price-amount")?.textContent?.trim() || null;
        const inStock = !document.querySelector(".out-of-stock");
        const image = (document.querySelector(".woocommerce-product-gallery__image img") as HTMLImageElement)?.src || null;
        return { title, price, oldPrice, inStock, image };
      }).catch(() => null);

      return {
        title: data?.title || null,
        price: toTaka(data?.price),
        oldPrice: toTaka(data?.oldPrice),
        inStock: data?.inStock ?? null,
        image: data?.image || null,
        via: "gadstyle-woo",
      };
    },
  },

  rokomari: {
    id: "rokomari",
    name: "Rokomari",
    hosts: ["rokomari.com", "www.rokomari.com"],
    sampleUrl: "https://www.rokomari.com",
    strategy: "direct_or_browser",
    async extract(page, html) {
      for (const ld of jsonLd(html) as Array<Record<string, unknown>>) {
        if (ld["@type"] === "Product" || ld["@type"] === "Book") {
          const offer = (ld.offers || {}) as Record<string, unknown>;
          return {
            title: (ld.name as string) || null,
            price: toTaka(offer.price),
            inStock: offer.availability ? String(offer.availability).includes("InStock") : null,
            image: typeof ld.image === "string" ? ld.image : null,
            via: "rokomari-jsonld",
          };
        }
      }

      const data = await page.evaluate(() => {
        const title = document.querySelector(".details-book-main-info__title, h1")?.textContent?.trim() || null;
        const price = document.querySelector(".sell-price, .text-brand, .details-book-main-info__price")?.textContent?.trim() || null;
        const oldPrice = document.querySelector(".original-price, strike, del")?.textContent?.trim() || null;
        const inStock = !document.querySelector(".btn-out-of-stock, .out-of-stock");
        const image = (document.querySelector(".details-book-main-img img, #js--product-image") as HTMLImageElement)?.src || null;
        return { title, price, oldPrice, inStock, image };
      }).catch(() => null);

      return {
        title: data?.title || null,
        price: toTaka(data?.price),
        oldPrice: toTaka(data?.oldPrice),
        inStock: data?.inStock ?? null,
        image: data?.image || null,
        via: "rokomari-dom",
      };
    },
  },

  themallbd: {
    id: "themallbd",
    name: "The Mall BD",
    hosts: ["themallbd.com", "www.themallbd.com"],
    sampleUrl: "https://themallbd.com",
    strategy: "direct_or_browser",
    async extract(page, html) {
      const ogPrice = metaContent(html, "product:price:amount");
      const ogTitle = metaContent(html, "og:title");
      const ogImage = metaContent(html, "og:image");

      const dom = await page.evaluate(() => {
        const title = document.querySelector("h1.product_title, h1")?.textContent?.trim() || null;
        const price = document.querySelector(".price ins .woocommerce-Price-amount, .price .woocommerce-Price-amount, .price")?.textContent?.trim() || null;
        const oldPrice = document.querySelector(".price del .woocommerce-Price-amount")?.textContent?.trim() || null;
        const inStock = !document.querySelector(".out-of-stock");
        return { title, price, oldPrice, inStock };
      }).catch(() => null);

      return {
        title: dom?.title || ogTitle || null,
        price: toTaka(dom?.price) || toTaka(ogPrice),
        oldPrice: toTaka(dom?.oldPrice),
        inStock: dom?.inStock ?? true,
        image: ogImage || null,
        via: "themallbd-woo",
      };
    },
  },

  naturo: {
    id: "naturo",
    name: "Naturo BD",
    hosts: ["naturobd.com", "www.naturobd.com"],
    sampleUrl: "https://naturobd.com",
    strategy: "direct_or_browser",
    async extract(page, html) {
      for (const ld of jsonLd(html) as Array<Record<string, unknown>>) {
        if (ld["@type"] === "Product") {
          const offer = (ld.offers || {}) as Record<string, unknown>;
          return {
            title: (ld.name as string) || null,
            price: toTaka(offer.price),
            inStock: offer.availability ? String(offer.availability).includes("InStock") : null,
            image: typeof ld.image === "string" ? ld.image : null,
            via: "naturo-jsonld",
          };
        }
      }

      const data = await page.evaluate(() => {
        const title = document.querySelector("h1.product_title, h1")?.textContent?.trim() || null;
        const price = document.querySelector(".price .woocommerce-Price-amount, .price")?.textContent?.trim() || null;
        const oldPrice = document.querySelector(".price del .woocommerce-Price-amount")?.textContent?.trim() || null;
        return { title, price, oldPrice };
      }).catch(() => null);

      return {
        title: data?.title || null,
        price: toTaka(data?.price),
        oldPrice: toTaka(data?.oldPrice),
        via: "naturo-dom",
      };
    },
  },
};

let sharedBrowser: Browser | null = null;

async function getBrowser(): Promise<Browser> {
  if (!sharedBrowser) {
    sharedBrowser = await chromium.launch({
      headless: true,
      args: [
        "--disable-blink-features=AutomationControlled",
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-web-security",
      ],
    });
  }
  return sharedBrowser;
}

export async function createStealthContext(browser: Browser): Promise<BrowserContext> {
  const context = await browser.newContext({
    userAgent: USER_AGENT,
    viewport: { width: 1366, height: 768 },
    locale: "en-US",
    extraHTTPHeaders: {
      "Accept-Language": "en-US,en;q=0.9,bn;q=0.8",
      "Sec-Ch-Ua": '"Not_A Brand";v="8", "Chromium";v="126", "Google Chrome";v="126"',
      "Sec-Ch-Ua-Mobile": "?0",
      "Sec-Ch-Ua-Platform": '"macOS"',
    },
  });

  await context.addInitScript(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => undefined });
  });

  return context;
}

export function findStoreConfig(urlStr: string): SpecialStoreConfig | null {
  try {
    const parsed = new URL(urlStr);
    const host = parsed.hostname.toLowerCase().replace(/^www\./, "");
    for (const config of Object.values(SPECIAL_STORES)) {
      if (config.hosts.some((h) => h.replace(/^www\./, "") === host)) {
        return config;
      }
    }
  } catch {
    // Ignore invalid url
  }
  return null;
}

export async function fetchSpecialStoreQuote(targetUrl: string): Promise<SpecialStoreQuote> {
  const store = findStoreConfig(targetUrl);
  const browser = await getBrowser();
  const context = await createStealthContext(browser);
  const page = await context.newPage();

  try {
    const res = await page.goto(targetUrl, {
      waitUntil: "domcontentloaded",
      timeout: 30_000,
    });

    const status = res?.status() ?? 0;
    const html = await page.content();
    const pageTitle = await page.title();

    let extracted: Partial<SpecialStoreQuote> = {};
    if (store) {
      extracted = await store.extract(page, html, targetUrl);
    } else {
      extracted = await universalExtract(page, html, targetUrl);
    }

    return {
      storeId: store?.id ?? new URL(targetUrl).hostname.replace(/^www\./, ""),
      storeName: store?.name ?? new URL(targetUrl).hostname,
      url: targetUrl,
      title: extracted.title ?? pageTitle ?? null,
      price: extracted.price ?? null,
      oldPrice: extracted.oldPrice ?? null,
      inStock: extracted.inStock ?? (status === 200),
      image: extracted.image ?? null,
      via: extracted.via ?? "stealth-browser",
      platform: extracted.platform ?? detectPlatform(html),
      timestamp: new Date().toISOString(),
    };
  } finally {
    await context.close();
  }
}

export async function probeSpecialStores(targetStoreId?: string): Promise<StoreProbeResult[]> {
  const storesToProbe = targetStoreId
    ? Object.values(SPECIAL_STORES).filter((s) => s.id === targetStoreId)
    : Object.values(SPECIAL_STORES);

  const browser = await getBrowser();
  const results: StoreProbeResult[] = [];

  for (const store of storesToProbe) {
    console.log(`\n🔍 Probing store: ${store.name} (${store.id})...`);
    let httpStatus: number | null = null;
    let browserStatus: number | null = null;
    let pageTitle: string | null = null;
    const extractedPrice: number | null = null;
    let notes = "";
    let accessible = false;

    // 1. Quick HTTP test
    try {
      const httpRes = await fetch(store.sampleUrl, {
        headers: { "user-agent": USER_AGENT },
        signal: AbortSignal.timeout(10_000),
      });
      httpStatus = httpRes.status;
    } catch (e) {
      notes += `HTTP fetch failed: ${(e as Error).message}. `;
    }

    // 2. Browser test with stealth
    const context = await createStealthContext(browser);
    const page = await context.newPage();
    try {
      const res = await page.goto(store.sampleUrl, {
        waitUntil: "domcontentloaded",
        timeout: 25_000,
      });
      browserStatus = res?.status() ?? null;
      pageTitle = await page.title();
      accessible = browserStatus === 200 || browserStatus === 304;

      if (/challenge|just a moment|attention required/i.test(pageTitle || "")) {
        notes += "Cloudflare Turnstile / Challenge detected. ";
      } else {
        notes += "Accessible via Stealth Browser! ";
      }
    } catch (e) {
      notes += `Browser error: ${(e as Error).message}. `;
    } finally {
      await context.close();
    }

    results.push({
      id: store.id,
      name: store.name,
      sampleUrl: store.sampleUrl,
      httpStatus,
      browserStatus,
      title: pageTitle,
      price: extractedPrice,
      method: store.strategy,
      accessible,
      notes: notes.trim(),
    });
  }

  return results;
}

// -------------------------------------------------------------
// Smart Domain Scanner
// -------------------------------------------------------------
export async function smartScanDomain(target: string) {
  let targetUrl = target.trim();
  if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
    targetUrl = `https://${targetUrl}`;
  }

  console.log(`\n🌐 Smart Scanning Domain/URL: ${targetUrl}`);
  const parsed = new URL(targetUrl);
  const isProductPage = parsed.pathname.length > 3 && parsed.pathname !== "/";

  const browser = await getBrowser();
  const context = await createStealthContext(browser);
  const page = await context.newPage();

  try {
    const res = await page.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: 30_000 });
    const html = await page.content();
    const platform = detectPlatform(html);
    console.log(`✅ Loaded: ${targetUrl} (Status: ${res?.status()})`);
    console.log(`🛠️ Detected Platform: ${platform}`);

    if (isProductPage) {
      const quote = await fetchSpecialStoreQuote(targetUrl);
      console.log("\n📦 Extracted Product Quote:");
      console.log(JSON.stringify(quote, null, 2));
      return { type: "product", platform, quote };
    }

    // Home / Domain Page: find sample product links
    const productLinks = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll("a[href]"))
        .map((a) => (a as HTMLAnchorElement).href)
        .filter((h) => /\/(product|item|book|p|products|shop)\/[a-z0-9-_]+/i.test(h));
      return Array.from(new Set(links)).slice(0, 5);
    });

    console.log(`🔎 Found ${productLinks.length} sample product links on homepage:`, productLinks);

    let sampleQuote: SpecialStoreQuote | null = null;
    if (productLinks.length > 0) {
      console.log(`Testing first product: ${productLinks[0]}`);
      sampleQuote = await fetchSpecialStoreQuote(productLinks[0]);
      console.log("Sample extracted quote:", sampleQuote);
    }

    return {
      type: "domain",
      platform,
      domain: parsed.hostname,
      sampleLinks: productLinks,
      sampleQuote,
    };
  } finally {
    await context.close();
  }
}

// -------------------------------------------------------------
// Database Sync Engine (Worker Equivalent)
// -------------------------------------------------------------
function getSupabase(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

interface DBOfferRow {
  id: string;
  variant_id: string;
  seller_id: string;
  url: string;
  price: number;
  condition: string;
  variants: {
    label: string;
    product_id: string;
    products: { name: string; images: string[] | null } | null;
  } | null;
  sellers: { name: string; website: string } | null;
}

export async function syncSpecialOffers(storeFilter?: string) {
  const sb = getSupabase();
  if (!sb) {
    console.error("❌ Supabase URL and Key not found in environment. Please set SUPABASE_URL and SUPABASE_SERVICE_KEY.");
    return;
  }

  console.log("===============================================================================");
  console.log(" ⚡ Running Intelligent Special Stores Sync (Database Update Mode)");
  console.log("===============================================================================");

  // 1. Fetch offers
  const { data: offers, error } = await sb
    .from("offers")
    .select(`
      id, variant_id, seller_id, url, price, condition,
      variants(label, product_id, products(name, images)),
      sellers(name, website)
    `)
    .not("url", "is", null);

  if (error || !offers) {
    console.error("Failed to query offers from database:", error);
    return;
  }

  // Filter offers matching our special stores or the specified filter
  const targetOffers = (offers as unknown as DBOfferRow[]).filter((o) => {
    if (!o.url) return false;
    if (storeFilter) return o.url.includes(storeFilter);
    return Object.values(SPECIAL_STORES).some((s) => s.hosts.some((h) => o.url.includes(h.replace(/^www\./, ""))));
  });

  console.log(`Found ${targetOffers.length} tracked offers in database matching special stores.`);

  let checked = 0;
  let changed = 0;
  let anomalies = 0;
  let failed = 0;

  for (const offer of targetOffers) {
    const prodName = offer.variants?.products?.name || "Product";
    const variantLabel = offer.variants?.label || "";
    console.log(`\nChecking: ${prodName} ${variantLabel} | Current DB Price: ৳${offer.price}`);
    console.log(`URL: ${offer.url}`);

    try {
      const quote = await fetchSpecialStoreQuote(offer.url);
      checked++;

      if (!quote.price) {
        console.log(`⚠️ Price not found on page (${quote.via}). Skipped.`);
        continue;
      }

      console.log(`Live Extracted: ৳${quote.price} (Old: ৳${quote.oldPrice ?? "None"}, Stock: ${quote.inStock})`);

      // Intelligent Anomaly Detection: if price changed by >60%
      const diff = Math.abs(quote.price - offer.price) / offer.price;
      if (diff > 0.6) {
        console.log(`🚨 ANOMALY: Price jump of ${Math.round(diff * 100)}%! Queuing for Admin Review instead of direct update.`);
        anomalies++;
        await sb.from("review_queue").insert({
          kind: "anomaly",
          payload: {
            offerId: offer.id,
            url: offer.url,
            product: `${prodName} ${variantLabel}`,
            seller: offer.sellers?.name || "Special Store",
            from: String(offer.price),
            to: String(quote.price),
            reason: `বিশেষ দোকান সিঙ্কে দাম ${Math.round(diff * 100)}% পরিবর্তিত পাওয়া গেছে`,
          },
          status: "pending",
        });
        continue;
      }

      // Safe update
      const isPriceChanged = quote.price !== offer.price;
      if (isPriceChanged) changed++;

      await sb
        .from("offers")
        .update({
          price: quote.price,
          old_price: quote.oldPrice ?? null,
          in_stock: quote.inStock ?? true,
          checked_at: new Date().toISOString(),
        })
        .eq("id", offer.id);

      // Save product image if missing
      if (quote.image && offer.variants?.product_id) {
        const existingImages = offer.variants.products?.images || [];
        if (!existingImages.includes(quote.image) && existingImages.length < 5) {
          await sb
            .from("products")
            .update({ images: [...existingImages, quote.image] })
            .eq("id", offer.variants.product_id);
          console.log(`📸 Added product image: ${quote.image}`);
        }
      }

      console.log(`✅ Database Updated successfully! (${isPriceChanged ? "Price Changed" : "Price Same, Stock Refreshed"})`);
    } catch (e) {
      failed++;
      console.error(`❌ Failed to sync ${offer.url}: ${(e as Error).message}`);
    }
  }

  console.log("\n===============================================================================");
  console.log(`🎉 Sync Completed! Checked: ${checked} | Changed: ${changed} | Anomalies: ${anomalies} | Failed: ${failed}`);
  console.log("===============================================================================");
}

export async function closeSpecialBrowser() {
  if (sharedBrowser) {
    await sharedBrowser.close().catch(() => undefined);
    sharedBrowser = null;
  }
}

// CLI Runner
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || "probe";

  if (command === "probe") {
    const targetStore = args[1];
    console.log("===============================================================================");
    console.log(" 🚀 Dordam Special Stores Diagnostics & Recovery Suite");
    console.log(" Purpose: Ensure previously excluded BD stores remain accessible and fetchable");
    console.log("===============================================================================");
    const results = await probeSpecialStores(targetStore);
    console.log("\n--- Probe Results Summary ---");
    console.table(
      results.map((r) => ({
        Store: r.name,
        HTTP: r.httpStatus ?? "ERR",
        Browser: r.browserStatus ?? "ERR",
        Title: r.title ? r.title.slice(0, 35) : "N/A",
        Accessible: r.accessible ? "✅ YES" : "⚠️ BLOCKED/CHALLENGE",
        Notes: r.notes.slice(0, 40),
      })),
    );
  } else if (command === "scrape" || command === "fetch") {
    const url = args[1];
    if (!url) {
      console.error("❌ Please provide a URL to scrape. Example: npm run store:special scrape <URL>");
      process.exit(1);
    }
    console.log(`Scraping product: ${url}`);
    const quote = await fetchSpecialStoreQuote(url);
    console.log("\n--- Scraped Result ---");
    console.log(JSON.stringify(quote, null, 2));
  } else if (command === "scan") {
    const target = args[1];
    if (!target) {
      console.error("❌ Please provide a domain or URL. Example: npm run store:special scan techlandbd.com");
      process.exit(1);
    }
    await smartScanDomain(target);
  } else if (command === "sync") {
    const filter = args[1];
    await syncSpecialOffers(filter);
  } else {
    console.log(`
Usage:
  npx tsx scripts/special-stores.ts probe [store-id]      # Test reachability of all special stores
  npx tsx scripts/special-stores.ts scrape <url>          # Extract live product & price from any URL
  npx tsx scripts/special-stores.ts scan <domain_or_url>  # Smart auto-detect platform & extract live data
  npx tsx scripts/special-stores.ts sync [store-name]     # Intelligently update database offers like Worker!

Supported Stores Configured:
  ${Object.keys(SPECIAL_STORES).join(", ")}
`);
  }

  await closeSpecialBrowser();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
  });
}
