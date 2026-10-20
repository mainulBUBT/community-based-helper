import { render } from "../lib/browser";
import { quoteFrom } from "../lib/extract";
import { getText } from "../lib/http";
import type { Store } from "./types";

export function pageHtml(store: Store, url: string): Promise<string> {
  return store.rendered ? render(url, store.priceSelector) : getText(url);
}

export async function readQuote(store: Store, url: string, useLlm = true) {
  return quoteFrom(await pageHtml(store, url), store.parse, useLlm);
}
