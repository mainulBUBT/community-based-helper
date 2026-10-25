import type { MetadataRoute } from "next";
import { SITE_URL } from "@/config/site";
import { loadCatalog } from "@/services/catalog.server";
import { categoryFamily } from "@/utils/categories";
import { toEnPath } from "@/utils/locale-path";

export const dynamic = "force-static";

type Frequency = MetadataRoute.Sitemap[number]["changeFrequency"];

const latest = (dates: string[]) => (dates.length ? dates.reduce((a, b) => (b > a ? b : a)) : undefined);

// প্রতিটা পেজ দুই ভাষায় আলাদা সারি, দুটোতেই একে অপরের hreflang; lastmod হলো ওই পেজের দাম শেষ কবে যাচাই হয়েছে
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { products, sellers, categories, offers } = await loadCatalog();
  const variantProduct = new Map(products.flatMap((p) => p.variants.map((v) => [v.id, p] as const)));
  const checked = new Map<string, string[]>();
  const mark = (key: string, date: string) => checked.set(key, [...(checked.get(key) ?? []), date]);
  for (const offer of offers) {
    const product = variantProduct.get(offer.variantId);
    if (product) mark(`p:${product.slug}`, offer.checkedAt);
    if (product) mark(`c:${product.category}`, offer.checkedAt);
    mark(`s:${offer.sellerId}`, offer.checkedAt);
  }
  const everything = latest(offers.map((o) => o.checkedAt));
  const pages: [string, Frequency, number, string | undefined][] = [
    ["/", "hourly", 1, everything],
    ["/sellers/", "weekly", 0.5, everything],
    ["/about/", "monthly", 0.3, undefined],
    ...categories.map((c): [string, Frequency, number, string | undefined] => [
      `/category/${c.slug}/`,
      "daily",
      0.8,
      latest(categoryFamily(categories, c.slug).flatMap((slug) => checked.get(`c:${slug}`) ?? [])),
    ]),
    ...products.map((p): [string, Frequency, number, string | undefined] => [`/product/${p.slug}/`, "daily", 0.9, latest(checked.get(`p:${p.slug}`) ?? [])]),
    ...sellers.map((s): [string, Frequency, number, string | undefined] => [`/seller/${s.id}/`, "weekly", 0.5, latest(checked.get(`s:${s.id}`) ?? [])]),
  ];
  return pages.flatMap(([path, changeFrequency, priority, lastModified]) => {
    const languages = { bn: `${SITE_URL}${path}`, en: `${SITE_URL}${toEnPath(path)}`, "x-default": `${SITE_URL}${path}` };
    const shared = { changeFrequency, alternates: { languages }, ...(lastModified && { lastModified }) };
    return [
      { url: languages.bn, priority, ...shared },
      { url: languages.en, priority: Math.round(priority * 8) / 10, ...shared },
    ];
  });
}
