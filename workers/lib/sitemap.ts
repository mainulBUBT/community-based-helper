import { decode } from "./html";
import { getText } from "./http";

// sitemap index এ পণ্যের sitemap থাকলে শুধু সেগুলো, ব্লগ বা পেজের sitemap নয়
export async function sitemapUrls(url: string): Promise<string[]> {
  const xml = await getText(url);
  const locs = [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map(([, loc]) => decode(loc));
  if (!/<sitemapindex/i.test(xml)) return locs;
  const products = locs.filter((loc) => /product/i.test(loc));
  const nested = await Promise.all((products.length ? products : locs).map(sitemapUrls));
  return nested.flat();
}
