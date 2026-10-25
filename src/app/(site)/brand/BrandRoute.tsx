import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { SearchView } from "@/app/(site)/search/SearchView";
import { StaticResults } from "@/components/search/StaticResults";
import { JsonLd } from "@/components/ui/JsonLd";
import { messages, pageMeta } from "@/lib/page-meta";
import type { Lang } from "@/lib/preferences";
import { BRAND_MIN_PRODUCTS, getBrandPage, listBrands } from "@/services/catalog.server";
import { banglaName } from "@/utils/bangla-name";
import { categoryName } from "@/utils/categories";
import { breadcrumbData, itemListData } from "@/utils/structured-data";
import { brandPath } from "@/utils/url";

export async function brandParams() {
  return (await listBrands()).map((b) => ({ slug: b.slug }));
}

export async function brandMetadata(slug: string, lang: Lang): Promise<Metadata> {
  const page = await getBrandPage(slug);
  if (!page) return {};
  const { seo } = messages(lang);
  const kinds = page.categories.map((c) => categoryName(c, lang)).join(", ");
  return pageMeta({
    lang,
    path: `/brand/${slug}/`,
    title: seo.brandTitle(page.brand, banglaName(page.brand, "")?.trim() ?? null),
    shortTitle: seo.brandShortTitle(page.brand),
    description: seo.brandDescription(page.brand, kinds),
    image: page.summaries[0]?.product.images?.[0],
    index: page.summaries.length >= BRAND_MIN_PRODUCTS,
  });
}

// ক্যাটাগরি পেজের মতোই: Suspense এর fallback এ পণ্যের তালিকা স্ট্যাটিক HTML এ, তারপর ফিল্টার চালু
export async function BrandPage({ slug, lang }: { slug: string; lang: Lang }) {
  const page = await getBrandPage(slug);
  if (!page) notFound();
  const t = messages(lang);
  const prefix = lang === "en" ? "/en" : "";
  const crumbs = [
    { name: t.nav.home, path: `${prefix}/` },
    { name: page.brand, path: brandPath(prefix, page.brand) },
  ];
  return (
    <>
      <JsonLd data={[breadcrumbData(crumbs), itemListData(page.summaries.slice(0, 24).map((s) => s.product), prefix)]} />
      <Suspense fallback={<StaticResults t={t} prefix={prefix} title={page.brand} summaries={page.summaries} />}>
        <SearchView brand={page.brand} initial={page.summaries} />
      </Suspense>
    </>
  );
}
