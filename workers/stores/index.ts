import { decode, stripTags } from "../lib/html";
import { getText } from "../lib/http";
import { toTaka, type Quote } from "../lib/price";
import { sitemapUrls } from "../lib/sitemap";
import type { Listing, Store } from "./types";

function slugListing(url: string): Listing {
  const slug = new URL(url).pathname.split("/").filter(Boolean).pop() ?? "";
  return { title: decodeURIComponent(slug).replace(/[-_]+/g, " "), url, price: null, oldPrice: null };
}

// সাধারণ দোকান: product sitemap থেকে listing, দাম পাতা থেকে নিজে থেকেই (JSON-LD/itemprop/og)।
// নতুন দোকান যোগ করতে শুধু নিচের টেবিলে একটা এন্ট্রি লাগে।
function sitemapStore(config: { id: string; name: string; origin: string; sample: string; sitemap: string; prefix: string; promoUrl?: string }): Store {
  return {
    ...config,
    promoUrl: config.promoUrl ?? null,
    rendered: false,
    async discover() {
      const urls = await sitemapUrls(config.sitemap);
      return urls.filter((url) => url.startsWith(config.prefix)).map(slugListing);
    },
  };
}

const applegadgets = sitemapStore({
  id: "applegadgets",
  name: "Apple Gadgets",
  origin: "https://www.applegadgetsbd.com",
  sample: "https://www.applegadgetsbd.com/product/iphone-17-pro-max",
  sitemap: "https://www.applegadgetsbd.com/product/sitemap.xml",
  prefix: "https://www.applegadgetsbd.com/product/",
});

// --- ব্যতিক্রম ---

// Gadget & Gear: দাম JavaScript-এ বসে, তাই Playwright আর নিজস্ব পার্সার
function parseGadgetAndGear(html: string): Quote | null {
  const top = /<p[^>]*class="[^"]*Top-module[^"]*__price[^"]*"[^>]*>([\s\S]*?)<\/p>/.exec(html)?.[1];
  if (!top) return null;
  const amounts = [...stripTags(top).matchAll(/Tk\.?\s*([\d,]+)/gi)].map(([, n]) => toTaka(n)).filter((n): n is number => n != null);
  if (amounts.length === 0) return null;
  const price = Math.min(...amounts);
  const oldPrice = Math.max(...amounts);
  const name = /<h1[^>]*>([\s\S]*?)<\/h1>/.exec(html)?.[1];
  return { price, oldPrice: oldPrice > price ? oldPrice : null, inStock: null, title: name ? stripTags(name) : null, via: "gadgetandgear" };
}

const gadgetandgear: Store = {
  ...sitemapStore({
    id: "gadgetandgear",
    name: "Gadget & Gear",
    origin: "https://gadgetandgear.com",
    sample: "https://gadgetandgear.com/product/galaxy-a57-5g-12gb-256gb",
    sitemap: "https://gadgetandgear.com/sitemap.xml",
    prefix: "https://gadgetandgear.com/product/",
    promoUrl: "https://gadgetandgear.com/offers",
  }),
  rendered: true,
  priceSelector: "[class*='Top-module'][class*='__price']",
  parse: parseGadgetAndGear,
};

// Star Tech: product sitemap নেই, ক্যাটাগরি পেজ পাতা ধরে ঘুরে listing
const STARTECH = "https://www.startech.com.bd";
const STARTECH_CATEGORIES = ["/mobile-phone", "/apple-macbook", "/apple-ipad", "/apple-smart-watch", "/gadget/smart-watch"];

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
  sample: `${STARTECH}/iphone-18-pro`,
  promoUrl: `${STARTECH}/information/offer`,
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
    return all.filter((item, i) => all.findIndex((other) => other.url === item.url) === i);
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
  sample: `${PICKABOO}/product-detail/apple-iphone-17`,
  promoUrl: null,
  async discover(names) {
    const lists: Listing[] = [];
    for (const name of names) lists.push(...parsePickabooListings(await getText(`${PICKABOO}/search-result/${encodeURIComponent(name)}`)));
    return lists;
  },
};

export const stores: Store[] = [startech, pickaboo, applegadgets, gadgetandgear];

export function storeFor(url: string): Store | undefined {
  const host = new URL(url).host.replace(/^www\./, "");
  return stores.find((store) => new URL(store.origin).host.replace(/^www\./, "") === host);
}
