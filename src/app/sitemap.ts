import type { MetadataRoute } from "next";
import { SITE_URL } from "@/config/site";
import { loadCatalog } from "@/services/catalog.server";

export const dynamic = "force-static";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { products, sellers } = await loadCatalog();
  const now = new Date();
  const entry = (path: string, changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"], priority: number): MetadataRoute.Sitemap[number] => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency,
    priority,
    alternates: { languages: { bn: `${SITE_URL}${path}`, en: `${SITE_URL}/en${path === "/" ? "/" : path}` } },
  });
  return [
    entry("/", "hourly", 1),
    entry("/search/", "daily", 0.6),
    entry("/about/", "monthly", 0.3),
    ...products.map((p) => entry(`/product/${p.slug}/`, "daily", 0.9)),
    ...sellers.map((s) => entry(`/seller/${s.id}/`, "weekly", 0.5)),
  ];
}
