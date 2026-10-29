import { render } from "../lib/browser";
import { NoPrice } from "../lib/errors";
import { quoteFrom } from "../lib/extract";
import { metaContent, title } from "../lib/html";
import { getText } from "../lib/http";
import { announcesNoPrice, structuredQuote } from "../lib/price";
import { pageOffers, type PageOffer } from "../lib/variants";
import { embeddedVariants } from "./parsers";
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
  const own = store.product ? await store.product(url) : null;
  if (own?.rows.length) return { offers: pageOffers(own.rows), title: own.title, image: own.image };
  const html = await pageHtml(store, url);
  if (announcesNoPrice(html)) throw new NoPrice(`${url}: দোকান দাম দেখায় না (To be announced)`);
  const image = metaContent(html, "og:image");
  // নিজের parser বা JSON-LD না থাকলে পাতার ভেতরের JSON (Next.js ইত্যাদি), AI-এর আগে
  const rows = store.variants ? await store.variants(html, url) : store.parse || structuredQuote(html) ? [] : embeddedVariants(html, url);
  if (rows.length) return { offers: pageOffers(rows), title: title(html), image };
  const quote = await quoteFrom(html, store.parse, useLlm);
  if (!quote) return null;
  const row = { options: [], region: null, price: quote.price, oldPrice: quote.oldPrice, inStock: quote.inStock };
  // AI এর দেওয়া নাম পাতার আসল শিরোনামের চেয়ে কম ভরসার, কারণ পাতার লেখা দিয়ে তাকে ভোলানো যায়
  const name = quote.via === "llm" ? (title(html) ?? quote.title) : (quote.title ?? title(html));
  return { offers: pageOffers([row]), title: name, image: quote.image ?? image };
}
