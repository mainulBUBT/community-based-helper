import { decode, stripTags } from "../lib/html";
import { getText } from "../lib/http";
import { toTaka } from "../lib/price";
import type { Listing, Store } from "./types";

const ORIGIN = "https://www.startech.com.bd";
const CATEGORIES = ["/mobile-phone", "/apple-macbook", "/apple-ipad", "/apple-smart-watch", "/gadget/smart-watch"];
const MAX_PAGES = 30;

function parseListings(html: string): Listing[] {
  return html.split('class="p-item"').slice(1).flatMap((block) => {
    const link = /class="p-item-name">\s*<a href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/.exec(block);
    if (!link) return [];
    const priceBlock = /class="p-item-price">([\s\S]*?)<\/div>/.exec(block)?.[1] ?? "";
    const price = toTaka(/price-new">([^<]+)/.exec(priceBlock)?.[1] ?? stripTags(priceBlock));
    const oldPrice = toTaka(/price-old">([^<]+)/.exec(priceBlock)?.[1]);
    return [{ title: stripTags(link[2]), url: decode(link[1]), price, oldPrice }];
  });
}

async function category(path: string): Promise<Listing[]> {
  const all: Listing[] = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const items = parseListings(await getText(`${ORIGIN}${path}${page > 1 ? `?page=${page}` : ""}`));
    const fresh = items.filter((item) => !all.some((seen) => seen.url === item.url));
    if (fresh.length === 0) break;
    all.push(...fresh);
  }
  return all;
}

export const startech: Store = {
  id: "startech",
  name: "Star Tech",
  origin: ORIGIN,
  rendered: false,
  sample: `${ORIGIN}/iphone-18-pro`,
  promoUrl: `${ORIGIN}/information/offer`,
  async discover() {
    const lists: Listing[] = [];
    for (const path of CATEGORIES) lists.push(...(await category(path)));
    return lists.filter((item, i) => lists.findIndex((other) => other.url === item.url) === i);
  },
};
