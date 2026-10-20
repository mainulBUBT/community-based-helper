import type { MetadataRoute } from "next";
import { SITE_URL } from "@/config/site";
import { loadCatalog } from "@/services/catalog";

export const dynamic = "force-static";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { products, sellers } = await loadCatalog();
  const now = new Date();
  return [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "hourly", priority: 1 },
    { url: `${SITE_URL}/search/`, lastModified: now, changeFrequency: "daily", priority: 0.6 },
    ...products.map((p) => ({ url: `${SITE_URL}/product/${p.slug}/`, lastModified: now, changeFrequency: "daily" as const, priority: 0.9 })),
    ...sellers.map((s) => ({ url: `${SITE_URL}/seller/${s.id}/`, lastModified: now, changeFrequency: "weekly" as const, priority: 0.5 })),
  ];
}
