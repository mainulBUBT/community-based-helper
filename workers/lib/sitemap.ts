import { render } from "./browser";
import { decode } from "./html";
import { getText } from "./http";

const MAX_DEPTH = 2;
const site = (url: string) => new URL(url).hostname.replace(/^www\./, "");
const sameSite = (a: string, b: string) => {
  try {
    return site(a) === site(b);
  } catch {
    return false;
  }
};

// sitemap index এ পণ্যের sitemap থাকলে শুধু সেগুলো, ব্লগ বা পেজের sitemap নয়; অন্য সাইটের বা আবার ঘুরে আসা sitemap বাদ
export async function sitemapUrls(url: string, depth = 0, seen = new Set<string>(), rendered = false): Promise<string[]> {
  if (seen.has(url) || depth > MAX_DEPTH) return [];
  seen.add(url);
  const xml = rendered ? await render(url) : await getText(url);
  const locs = [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map(([, loc]) => decode(loc));
  if (!/<sitemapindex/i.test(xml)) return locs;
  const own = locs.filter((loc) => sameSite(loc, url));
  const products = own.filter((loc) => /product/i.test(loc));
  const nested = await Promise.all((products.length ? products : own).map((loc) => sitemapUrls(loc, depth + 1, seen, rendered)));
  return nested.flat();
}

const PRODUCT_PATH = /^\/(products?|items?|shop|p)\/$/;

// robots.txt-এ দেওয়া sitemap, না থাকলে চেনা নামগুলো; প্রথম যেটায় এই সাইটেরই লিংক আছে
export async function findSitemap(origin: string): Promise<{ sitemap: string; urls: string[] } | null> {
  const robots = await getText(`${origin}/robots.txt`).catch(() => "");
  const listed = [...robots.matchAll(/^sitemap:\s*(\S+)/gim)].map(([, url]) => url);
  for (const sitemap of [...listed, `${origin}/sitemap_index.xml`, `${origin}/sitemap.xml`, `${origin}/product-sitemap.xml`]) {
    const urls = (await sitemapUrls(sitemap).catch(() => [])).filter((url) => sameSite(url, origin));
    if (urls.length) return { sitemap, urls };
  }
  return null;
}

// লিংকের প্রথম অংশ ধরে গোনা; পণ্যের মতো নাম (/product/, /item/ ...) আগে, তারপর বেশি লিংক
export function productPaths(urls: string[], origin: string): { path: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const url of urls) {
    if (!sameSite(url, origin)) continue;
    const { pathname } = new URL(url);
    const parts = pathname.split("/").filter(Boolean);
    const path = parts.length > 1 ? `/${parts[0]}/` : "/";
    counts.set(path, (counts.get(path) ?? 0) + 1);
  }
  return [...counts].map(([path, count]) => ({ path, count })).sort((a, b) => Number(PRODUCT_PATH.test(b.path)) - Number(PRODUCT_PATH.test(a.path)) || b.count - a.count);
}
