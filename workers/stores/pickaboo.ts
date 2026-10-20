import { decode, stripTags } from "../lib/html";
import { getText } from "../lib/http";
import type { Listing, Store } from "./types";

const ORIGIN = "https://www.pickaboo.com";

function parseListings(html: string): Listing[] {
  const seen = new Set<string>();
  return [...html.matchAll(/<a[^>]+href="((?:https:\/\/www\.pickaboo\.com)?\/product-detail\/[^"#?]+)"[^>]*>([\s\S]*?)<\/a>/g)].flatMap(
    ([, href, inner]) => {
      const url = new URL(decode(href), ORIGIN).href;
      const title = stripTags(inner);
      if (!title || seen.has(url)) return [];
      seen.add(url);
      return [{ title, url, price: null, oldPrice: null }];
    },
  );
}

export const pickaboo: Store = {
  id: "pickaboo",
  name: "Pickaboo",
  origin: ORIGIN,
  rendered: false,
  sample: `${ORIGIN}/product-detail/apple-iphone-17`,
  promoUrl: null,
  async discover(names) {
    const lists: Listing[] = [];
    for (const name of names) lists.push(...parseListings(await getText(`${ORIGIN}/search-result/${encodeURIComponent(name)}`)));
    return lists;
  },
};
