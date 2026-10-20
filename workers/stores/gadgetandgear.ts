import { stripTags } from "../lib/html";
import { toTaka, type Quote } from "../lib/price";
import { sitemapUrls } from "../lib/sitemap";
import { slugListing } from "./slug";
import type { Store } from "./types";

const ORIGIN = "https://gadgetandgear.com";

function parse(html: string): Quote | null {
  const top = /<p[^>]*class="[^"]*Top-module[^"]*__price[^"]*"[^>]*>([\s\S]*?)<\/p>/.exec(html)?.[1];
  if (!top) return null;
  const amounts = [...stripTags(top).matchAll(/Tk\.?\s*([\d,]+)/gi)].map(([, n]) => toTaka(n)).filter((n): n is number => n != null);
  if (amounts.length === 0) return null;
  const price = Math.min(...amounts);
  const oldPrice = Math.max(...amounts);
  const name = /<h1[^>]*>([\s\S]*?)<\/h1>/.exec(html)?.[1];
  return { price, oldPrice: oldPrice > price ? oldPrice : null, inStock: null, title: name ? stripTags(name) : null, via: "gadgetandgear" };
}

export const gadgetandgear: Store = {
  id: "gadgetandgear",
  name: "Gadget & Gear",
  origin: ORIGIN,
  rendered: true,
  priceSelector: "[class*='Top-module'][class*='__price']",
  sample: `${ORIGIN}/product/galaxy-a57-5g-12gb-256gb`,
  promoUrl: `${ORIGIN}/offers`,
  parse,
  async discover() {
    const urls = await sitemapUrls(`${ORIGIN}/sitemap.xml`);
    return urls.filter((url) => url.startsWith(`${ORIGIN}/product/`)).map(slugListing);
  },
};
