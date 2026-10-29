import { USER_AGENT } from "./lib/agent";
import { quoteFrom } from "./lib/extract";
import { metaContent } from "./lib/html";
import { getText } from "./lib/http";

// নতুন দোকান GitHub Actions এর IP থেকে খোলে কি না, দাম আর ছবি পড়া যায় কি না: `node --import tsx workers/probe.ts`
const URLS = [
  "https://haramainstore.com/sitemap.xml",
  "https://haramainstore.com/products/ajwa-super-premium-dates",
  "https://haramainstore.com/products/medjool-large-premium-dates-egyptian",
  "https://www.khaasfood.com/sitemap.xml",
  "https://www.khaasfood.com/product/ajwa-dates",
  "https://holybasketbd.com/product-sitemap.xml",
  "https://holybasketbd.com/product/ajwa-dates-500gm/",
  "https://holybasketbd.com/product/sukkari-dates-1kg/",
  "https://techmarvels.com.bd/sitemap_index.xml",
  "https://techmarvels.com.bd/product/hp-victus-15-fa2013dx-2024-i5-13420h-rtx-3050-6gb/",
  "https://techmarvels.com.bd/product/asus-tuf-gaming-a16-fa607nuq-2026-ryzen-7-170-rtx-4050/",
  "https://trekntread.com/sitemap.xml",
  "https://trekntread.com/products/adizero-adios-pro-evo-1-light-blue-grade-11",
  "https://trekntread.com/products/air-jordan-1-color-university-blue-low-neck-11-grade",
];

async function imageStatus(url: string | null | undefined): Promise<string> {
  if (!url) return "no image";
  const res = await fetch(url, { headers: { "user-agent": USER_AGENT } }).catch(() => null);
  return res ? `image ${res.status} ${res.headers.get("content-type")}` : "image unreachable";
}

// GitHub একটা step এ ১০টার বেশি notice দেখায় না, তাই প্রতি দোকানে একটা annotation, লাইনগুলো %0A দিয়ে জোড়া
async function main() {
  const byHost = new Map<string, { failed: boolean; lines: string[] }>();
  for (const url of URLS) {
    const host = new URL(url).host;
    const entry = byHost.get(host) ?? { failed: false, lines: [] };
    byHost.set(host, entry);
    try {
      const html = await getText(url);
      const quote = await quoteFrom(html, undefined, false);
      const price = quote ? `price ${quote.price} old ${quote.oldPrice} stock ${quote.inStock} via ${quote.via}` : "no structured price";
      const image = quote ? await imageStatus(quote.image ?? metaContent(html, "og:image")) : "";
      entry.lines.push(`OK ${url} ${html.length}b ${price} ${image}`);
    } catch (error) {
      entry.failed = true;
      entry.lines.push(`FAIL ${url} ${(error as Error).name}: ${(error as Error).message}`);
    }
  }
  for (const [host, { failed, lines }] of byHost) console.log(`::${failed ? "error" : "notice"} title=${failed ? "FAIL" : "OK"} ${host}::${lines.join("%0A")}`);
  console.log(`${[...byHost.values()].filter((e) => !e.failed).length}/${byHost.size} shops reachable`);
}

void main();
