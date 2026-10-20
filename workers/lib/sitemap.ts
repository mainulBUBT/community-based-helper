import { decode } from "./html";
import { getText } from "./http";

export async function sitemapUrls(url: string): Promise<string[]> {
  const xml = await getText(url);
  const locs = [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map(([, loc]) => decode(loc));
  if (!/<sitemapindex/i.test(xml)) return locs;
  const nested = await Promise.all(locs.map(sitemapUrls));
  return nested.flat();
}
