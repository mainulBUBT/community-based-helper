// Gemini-র url_context দিয়ে ব্লক হওয়া দোকানের পাতা পড়া যায় কি না, DB ছাড়া পরীক্ষা।
// চালাতে: .env.local এ LLM_BASE_URL/LLM_MODEL/LLM_API_KEY (Gemini), তারপর  npm run worker:ai-check [url ...]
import { aiRead } from "./lib/ai-page";

const DEFAULTS = ["https://www.sumashtech.com/product/iphone-18-pro", "https://kryinternational.com/products/iphone-18-pro", "https://gadgetbreeze.com.bd/product/xiaomi-redmi-watch-6-active/"];

async function main() {
  const urls = process.argv.slice(2).length ? process.argv.slice(2) : DEFAULTS;
  for (const url of urls) {
    const page = await aiRead(url);
    console.log(`\n${url}`);
    if (!page) {
      console.log("  পড়া যায়নি");
      continue;
    }
    console.log(`  ${page.title ?? "(শিরোনাম নেই)"}`);
    for (const offer of page.offers) console.log(`  ${offer.label || "(একটাই)"}${offer.region ? ` [${offer.region}]` : ""}: ৳${offer.price}${offer.oldPrice ? ` (আগে ৳${offer.oldPrice})` : ""}${offer.inStock === false ? " স্টকে নেই" : ""}`);
  }
}

main();
