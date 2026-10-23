import { StoreBlocked } from "../lib/errors";
import { decode, stripTags } from "../lib/html";
import { getText } from "../lib/http";
import { toTaka } from "../lib/price";
import { sitemapUrls } from "../lib/sitemap";
import { appleGadgetsVariants, dazzleVariants, gadgetAndGearVariants, kryVariants, maczenVariants, startechVariants, sumashVariants, wooVariants } from "./parsers";
import type { Condition, Listing, Store } from "./types";

const site = (url: string) => new URL(url).host.replace(/^www\./, "");

export function slugTitle(url: string): string {
  const slug = new URL(url).pathname.split("/").filter(Boolean).pop() ?? "";
  return decodeURIComponent(slug).replace(/[-_]+/g, " ");
}

function slugListing(url: string): Listing {
  return { title: slugTitle(url), url, price: null, oldPrice: null };
}

// সাধারণ দোকান: product sitemap থেকে listing, ভার্সনের দাম parser থেকে, না থাকলে JSON-LD/itemprop/og।
// নতুন দোকান যোগ করতে নিচের তালিকায় একটা এন্ট্রি লাগে।
function sitemapStore(config: {
  id: string;
  name: string;
  origin: string;
  sample: string;
  sitemap: string;
  path: string;
  match?: RegExp; // path এর নিচে ক্যাটাগরি পাতাও থাকলে, শুধু পণ্যের পাতা চেনার নিয়ম
  condition: Condition;
  promoUrl?: string;
  variants?: Store["variants"];
}): Store {
  return {
    ...config,
    promoUrl: config.promoUrl ?? null,
    rendered: false,
    async discover() {
      const urls = await sitemapUrls(config.sitemap);
      return urls.flatMap((url) => {
        const { pathname } = new URL(url);
        const product = pathname.startsWith(config.path) && (!config.match || config.match.test(pathname));
        return site(url) === site(config.origin) && product ? [slugListing(`${config.origin}${pathname}`)] : [];
      });
    },
  };
}

// Star Tech: product sitemap নেই, ক্যাটাগরি পেজ পাতা ধরে ঘুরে listing
const STARTECH = "https://www.startech.com.bd";
const STARTECH_CATEGORIES = [
  "/mobile-phone",
  "/apple-ipad",
  "/tablet-pc",
  "/apple-macbook",
  "/apple-imac",
  "/apple-mac-mini",
  "/apple-mac-studio",
  "/gadget/smart-watch",
  "/earbuds",
  "/accessories/headphone",
];

function parseStartechListings(html: string): Listing[] {
  return html.split('class="p-item"').slice(1).flatMap((block) => {
    const link = /class="p-item-name">\s*<a href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/.exec(block);
    if (!link) return [];
    const priceBlock = /class="p-item-price">([\s\S]*?)<\/div>/.exec(block)?.[1] ?? "";
    const price = toTaka(/price-new">([^<]+)/.exec(priceBlock)?.[1] ?? stripTags(priceBlock));
    const oldPrice = toTaka(/price-old">([^<]+)/.exec(priceBlock)?.[1]);
    return [{ title: stripTags(link[2]), url: decode(link[1]), price, oldPrice }];
  });
}

const startech: Store = {
  id: "startech",
  name: "Star Tech",
  origin: STARTECH,
  rendered: false,
  condition: "official",
  sample: `${STARTECH}/iphone-18-pro`,
  promoUrl: `${STARTECH}/information/offer`,
  variants: startechVariants,
  async discover() {
    const all: Listing[] = [];
    for (const path of STARTECH_CATEGORIES) {
      for (let page = 1; page <= 30; page++) {
        const items = parseStartechListings(await getText(`${STARTECH}${path}${page > 1 ? `?page=${page}` : ""}`));
        const fresh = items.filter((item) => !all.some((seen) => seen.url === item.url));
        if (fresh.length === 0) break;
        all.push(...fresh);
      }
    }
    return all;
  },
};

// Dazzle: product sitemap এ শুধু সাম্প্রতিক পণ্য, তাই ক্যাটালগের ব্র্যান্ডের সাব-ক্যাটাগরি (যেমন phones/iphone) থেকেও
const DAZZLE = "https://dazzle.com.bd";
const APPLE_LINES = /iphone|ipad|mac|apple|airpod/;

function brandCategory(url: string, brands: Set<string>): boolean {
  const [root, , leaf] = new URL(url).pathname.split("/").filter(Boolean);
  if (root !== "categories" || !leaf) return false;
  return [...brands].some((brand) => leaf.includes(brand) || (brand === "apple" && APPLE_LINES.test(leaf)));
}

const dazzleSitemap = sitemapStore({
  id: "dazzle",
  name: "Dazzle",
  origin: DAZZLE,
  sample: `${DAZZLE}/product/iphone-18-pro-price-in-bangladesh`,
  sitemap: `${DAZZLE}/products/sitemap.xml`,
  path: "/product/",
  condition: "unofficial",
  variants: dazzleVariants,
});

const dazzle: Store = {
  ...dazzleSitemap,
  async discover(products) {
    const urls = new Set((await dazzleSitemap.discover(products)).map((l) => l.url));
    const brands = new Set(products.flatMap((p) => p.brand.toLowerCase().split(/\s+/)).filter((w) => w.length > 2));
    const categories = (await sitemapUrls(`${DAZZLE}/categories/sitemap.xml`)).filter((url) => brandCategory(url, brands));
    for (const category of categories) {
      for (let page = 1, pages = 1; page <= Math.min(pages, 30); page++) {
        const html = await getText(`${category}${page > 1 ? `?page=${page}` : ""}`)
          .then((text) => text.replace(/\\"/g, '"'))
          .catch((error) => {
            if (error instanceof StoreBlocked) throw error;
            return "";
          });
        pages = Number(/"totalPages":(\d+)/.exec(html)?.[1] ?? pages);
        for (const [, slug] of html.matchAll(/"productSlug":"([^"]+)"/g)) urls.add(`${DAZZLE}/product/${slug}`);
      }
    }
    return [...urls].map(slugListing);
  },
};

// Pickaboo: robots.txt এ আটকায়; অনুমতি পেলে সার্চ-পেজ থেকে discover চালু করা যাবে
const PICKABOO = "https://www.pickaboo.com";

function parsePickabooListings(html: string): Listing[] {
  const seen = new Set<string>();
  return [...html.matchAll(/<a[^>]+href="((?:https:\/\/www\.pickaboo\.com)?\/product-detail\/[^"#?]+)"[^>]*>([\s\S]*?)<\/a>/g)].flatMap(([, href, inner]) => {
    const url = new URL(decode(href), PICKABOO).href;
    const title = stripTags(inner);
    if (!title || seen.has(url)) return [];
    seen.add(url);
    return [{ title, url, price: null, oldPrice: null }];
  });
}

const pickaboo: Store = {
  id: "pickaboo",
  name: "Pickaboo",
  origin: PICKABOO,
  rendered: false,
  condition: "official",
  sample: `${PICKABOO}/product-detail/apple-iphone-17`,
  promoUrl: null,
  async discover(products) {
    const lists: Listing[] = [];
    for (const { name } of products) lists.push(...parsePickabooListings(await getText(`${PICKABOO}/search-result/${encodeURIComponent(name)}`)));
    return lists;
  },
};

export const stores: Store[] = [
  startech,
  pickaboo,
  sitemapStore({
    id: "applegadgets",
    name: "Apple Gadgets",
    origin: "https://www.applegadgetsbd.com",
    sample: "https://www.applegadgetsbd.com/product/iphone-18-pro",
    sitemap: "https://www.applegadgetsbd.com/product/sitemap.xml",
    path: "/product/",
    condition: "unofficial",
    variants: appleGadgetsVariants,
  }),
  sitemapStore({
    id: "gadgetandgear",
    name: "Gadget & Gear",
    origin: "https://gadgetandgear.com",
    sample: "https://gadgetandgear.com/product/iphone-18-pro",
    sitemap: "https://gadgetandgear.com/sitemap.xml",
    path: "/product/",
    condition: "official",
    promoUrl: "https://gadgetandgear.com/offers",
    variants: gadgetAndGearVariants,
  }),
  sitemapStore({
    id: "sumashtech",
    name: "Sumash Tech",
    origin: "https://www.sumashtech.com",
    sample: "https://www.sumashtech.com/product/iphone-18-pro",
    sitemap: "https://www.sumashtech.com/__sitemap__/product.xml",
    path: "/product/",
    condition: "unofficial",
    variants: sumashVariants,
  }),
  sitemapStore({
    id: "kry",
    name: "Kry International",
    origin: "https://kryinternational.com",
    sample: "https://kryinternational.com/products/iphone-18-pro",
    sitemap: "https://kryinternational.com/sitemap.xml",
    path: "/products/",
    condition: "unofficial",
    variants: kryVariants,
  }),
  dazzle,
  sitemapStore({
    id: "maczen",
    name: "MacZen BD",
    origin: "https://www.maczenbd.com",
    sample: "https://www.maczenbd.com/products/macbook/15-inch-macbook-air-m5",
    sitemap: "https://www.maczenbd.com/sitemap.xml",
    path: "/products/",
    match: /^\/products\/[^/]+\/[^/]+$/,
    condition: "unofficial",
    variants: maczenVariants,
  }),
  sitemapStore({
    id: "diamu",
    name: "Diamu",
    origin: "https://diamu.com.bd",
    sample: "https://diamu.com.bd/product/iphone-18-pro/",
    sitemap: "https://diamu.com.bd/sitemap_index.xml",
    path: "/product/",
    condition: "unofficial",
    variants: wooVariants,
  }),
  sitemapStore({
    id: "executivemachines",
    name: "Executive Machines",
    origin: "https://executivemachines.com",
    sample: "https://executivemachines.com/product/iphone-18-pro-256-gb/",
    sitemap: "https://executivemachines.com/sitemap_index.xml",
    path: "/product/",
    condition: "official",
    variants: wooVariants,
  }),
  sitemapStore({
    id: "motionview",
    name: "Motion View",
    origin: "https://motionview.com.bd",
    sample: "https://motionview.com.bd/product/amazfit-active-2-square-smartwatch-premium-edition",
    sitemap: "https://motionview.com.bd/sitemap.xml",
    path: "/product/",
    condition: "official",
  }),
  sitemapStore({
    id: "gadgetbreeze",
    name: "Gadget Breeze",
    origin: "https://gadgetbreeze.com.bd",
    sample: "https://gadgetbreeze.com.bd/product/xiaomi-redmi-watch-6-active/",
    sitemap: "https://gadgetbreeze.com.bd/sitemap_index.xml",
    path: "/product/",
    condition: "unofficial",
    variants: wooVariants,
  }),
  sitemapStore({
    id: "mcsolution",
    name: "MC Solution",
    origin: "https://mcsolution.com.bd",
    sample: "https://mcsolution.com.bd/vivobook-pro-15-oled-n6506mv/",
    sitemap: "https://mcsolution.com.bd/sitemap_index.xml",
    path: "/", // পণ্যের slug মূল ডোমেনেই — ফিল্টার আসলে sitemap ফাইলই (product-sitemap)
    condition: "official",
    variants: wooVariants,
  }),
  sitemapStore({
    id: "istockbd",
    name: "iStockBD",
    origin: "https://istockbd.com",
    sample: "https://istockbd.com/products/new-apple-ipad-pro-2020-11-2020",
    sitemap: "https://istockbd.com/sitemap.xml",
    path: "/products/",
    condition: "unofficial",
  }),
  sitemapStore({
    id: "pcbstore",
    name: "PCB Store",
    origin: "https://pcbstore.com.bd",
    sample: "https://pcbstore.com.bd/product/pcb-blaak-v2-mouse-pad",
    sitemap: "https://pcbstore.com.bd/sitemap.xml",
    path: "/product/",
    condition: "unofficial",
    variants: wooVariants,
  }),
  sitemapStore({
    id: "custommacbd",
    name: "CustomMacBD",
    origin: "https://custommacbd.com",
    sample: "https://custommacbd.com/products/magic-mouse-2",
    sitemap: "https://custommacbd.com/sitemap.xml",
    path: "/products/",
    condition: "unofficial",
  }),
  sitemapStore({
    id: "maccity",
    name: "MacCity",
    origin: "https://maccity.com.bd",
    sample: "https://maccity.com.bd/apple-magic-keyboard-for-ipad-pro-11-inch-m4/",
    sitemap: "https://maccity.com.bd/sitemap.xml",
    path: "/", // এখানেও slug মূল ডোমেনে
    condition: "unofficial",
    variants: wooVariants,
  }),
];

// তালিকায় না থাকা দোকানের পুরনো দামও বাদ যায় না: JSON-LD/itemprop/og দিয়ে চেষ্টা
function genericStore(url: string): Store {
  const { origin } = new URL(url);
  return { id: site(url), name: site(url), origin, rendered: false, condition: "official", sample: url, promoUrl: null, variants: wooVariants, discover: async () => [] };
}

export function storeFor(url: string): Store {
  return stores.find((store) => site(store.origin) === site(url)) ?? genericStore(url);
}

export function conditionOf(store: Store, text: string): Condition {
  if (/\b(unofficial|intl|international)\b/i.test(text)) return "unofficial";
  if (/\bofficial\b/i.test(text)) return "official";
  return store.condition;
}
