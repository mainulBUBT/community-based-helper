import { USER_AGENT } from "./lib/agent";
import { quoteFrom } from "./lib/extract";
import { metaContent } from "./lib/html";
import { getText } from "./lib/http";

// নতুন দোকান GitHub Actions এর IP থেকে খোলে কি না, দাম আর ছবি পড়া যায় কি না: `node --import tsx workers/probe.ts`
const URLS = [
  "https://www.startech.com.bd/water-purifier",
  "https://www.startech.com.bd/pureit-classic-water-purifier",
  "https://mke.com.bd/sitemap-products.xml",
  "https://mke.com.bd/pureit-vital-max-water-purifier",
  "https://mke.com.bd/kent-grand-star-ro-water-purifier",
  "https://othoba.com/water-purifier",
  "https://othoba.com/sanaky-s1-water-purifier-aqua-life-engineering-1011081",
  "https://othoba.com/vision-ro-hot-and-cold-water-purifier-with-automatic-heating-coolingsystem",
  "https://www.rokomari.com/product/305848/pureit-classic-water-purifier-23l-69666955",
  "https://www.rokomari.com/product/373467/heron-pearl-ro-water-purifier",
  "https://www.rokomari.com/product/370903/vietnam-six-stage-sanaky-s1-mineral-ro-water-purifier",
];

async function imageStatus(url: string | null | undefined): Promise<string> {
  if (!url) return "no image";
  const res = await fetch(url, { headers: { "user-agent": USER_AGENT } }).catch(() => null);
  return res ? `image ${res.status} ${res.headers.get("content-type")}` : "image unreachable";
}

async function main() {
  let failed = 0;
  for (const url of URLS) {
    const host = new URL(url).host;
    try {
      const html = await getText(url);
      const quote = await quoteFrom(html, undefined, false);
      const price = quote ? `price ${quote.price} old ${quote.oldPrice} stock ${quote.inStock} via ${quote.via}` : "no structured price";
      const image = quote ? await imageStatus(quote.image ?? metaContent(html, "og:image")) : "";
      console.log(`::notice title=OK ${host}::${url} ${html.length}b ${price} ${image}`);
    } catch (error) {
      failed++;
      console.log(`::error title=FAIL ${host}::${url} ${(error as Error).name}: ${(error as Error).message}`);
    }
  }
  console.log(`${URLS.length - failed}/${URLS.length} reachable`);
}

void main();
