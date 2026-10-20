import { closeBrowser } from "./lib/browser";
import { message } from "./lib/errors";
import { readQuote } from "./stores/page";
import { stores } from "./stores";

async function main() {
  for (const store of stores) {
    try {
      const quote = await readQuote(store, store.sample, false);
      console.log(`${store.name.padEnd(14)} ${quote ? `৳${quote.price}${quote.oldPrice ? ` (was ৳${quote.oldPrice})` : ""} via ${quote.via}` : "no price found"}  ${store.sample}`);
    } catch (error) {
      console.log(`${store.name.padEnd(14)} skipped: ${message(error)}`);
    }
  }
  await closeBrowser();
}

main();
