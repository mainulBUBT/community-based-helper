import { render } from "../lib/browser";
import { NoPrice } from "../lib/errors";
import { quoteFrom } from "../lib/extract";
import { metaContent, title } from "../lib/html";
import { getText } from "../lib/http";
import { announcesNoPrice, structuredDelivery, structuredQuote } from "../lib/price";
import { pageOffers, type PageOffer } from "../lib/variants";
import { embeddedVariants } from "./parsers";
import type { DeliverySource, FoundDelivery } from "../services/sellers";
import type { Store } from "./types";

export interface Page {
  offers: PageOffer[];
  title: string | null;
  image: string | null;
  delivery?: { found: FoundDelivery; source: DeliverySource } | null;
}

export function pageHtml(store: Store, url: string): Promise<string> {
  return store.rendered ? render(url, store.priceSelector) : getText(url);
}

export async function readPage(store: Store, url: string, useLlm = true, fetched?: string): Promise<Page | null> {
  // বাইরে থেকে আনা HTML (Jina) হলে দোকানের নিজের fetch চলে না — সেটা তো আটকেই যায়
  const own = fetched ? null : store.product ? await store.product(url) : null;
  if (own?.rows.length) return { offers: pageOffers(own.rows), title: own.title, image: own.image };
  const html = fetched ?? (await pageHtml(store, url));
  if (announcesNoPrice(html)) throw new NoPrice(`${url}: দোকান দাম দেখায় না (To be announced)`);
  const image = metaContent(html, "og:image");
  const structured = structuredDelivery(html);
  const delivery = structured && { found: structured, source: "page" as const };
  // নিজের parser বা JSON-LD না থাকলে পাতার ভেতরের JSON (Next.js ইত্যাদি), AI-এর আগে
  const rows = store.variants ? await store.variants(html, url) : store.parse || structuredQuote(html) ? [] : embeddedVariants(html, url);
  if (rows.length) return { offers: pageOffers(rows), title: title(html), image, delivery };
  const quote = await quoteFrom(html, store.parse, useLlm);
  if (!quote) return null;
  const row = { options: [], region: null, price: quote.price, oldPrice: quote.oldPrice, inStock: quote.inStock };
  // AI এর দেওয়া নাম পাতার আসল শিরোনামের চেয়ে কম ভরসার, কারণ পাতার লেখা দিয়ে তাকে ভোলানো যায়
  const name = quote.via === "llm" ? (title(html) ?? quote.title) : (quote.title ?? title(html));
  const read = quote.delivery && { found: quote.delivery, source: "ai" as const };
  return { offers: pageOffers([row]), title: name, image: quote.image ?? image, delivery: delivery ?? read };
}
