import { decode } from "./html";
import { getText } from "./http";

const MAX_DEPTH = 2;
const site = (url: string) => new URL(url).hostname.replace(/^www\./, "");

// sitemap index এ পণ্যের sitemap থাকলে শুধু সেগুলো, ব্লগ বা পেজের sitemap নয়; অন্য সাইটের বা আবার ঘুরে আসা sitemap বাদ
export async function sitemapUrls(url: string, depth = 0, seen = new Set<string>()): Promise<string[]> {
  if (seen.has(url) || depth > MAX_DEPTH) return [];
  seen.add(url);
  const xml = await getText(url);
  const locs = [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map(([, loc]) => decode(loc));
  if (!/<sitemapindex/i.test(xml)) return locs;
  const own = locs.filter((loc) => {
    try {
      return site(loc) === site(url);
    } catch {
      return false;
    }
  });
  const products = own.filter((loc) => /product/i.test(loc));
  const nested = await Promise.all((products.length ? products : own).map((loc) => sitemapUrls(loc, depth + 1, seen)));
  return nested.flat();
}
