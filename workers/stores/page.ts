import { render } from "../lib/browser";
import { quoteFrom } from "../lib/extract";
import { metaContent, title } from "../lib/html";
import { getText } from "../lib/http";
import { pageOffers, type PageOffer } from "../lib/variants";
import type { Store } from "./types";

export interface Page {
  offers: PageOffer[];
  title: string | null;
  image: string | null;
}

export function pageHtml(store: Store, url: string): Promise<string> {
  return store.rendered ? render(url, store.priceSelector) : getText(url);
}

export async function readPage(store: Store, url: string, useLlm = true): Promise<Page | null> {
  const html = await pageHtml(store, url);
  const image = metaContent(html, "og:image");
  const rows = store.variants ? await store.variants(html, url) : [];
  if (rows.length) return { offers: pageOffers(rows), title: title(html), image };
  const quote = await quoteFrom(html, store.parse, useLlm);
  if (!quote) return null;
  const row = { options: [], region: null, price: quote.price, oldPrice: quote.oldPrice, inStock: quote.inStock };
  // AI এর দেওয়া নাম পাতার আসল শিরোনামের চেয়ে কম ভরসার, কারণ পাতার লেখা দিয়ে তাকে ভোলানো যায়
  const name = quote.via === "llm" ? (title(html) ?? quote.title) : (quote.title ?? title(html));
  return { offers: pageOffers([row]), title: name, image: quote.image ?? image };
}
