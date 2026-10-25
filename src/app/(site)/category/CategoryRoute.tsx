import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { SearchView } from "@/app/(site)/search/SearchView";
import { StaticResults } from "@/components/search/StaticResults";
import { JsonLd } from "@/components/ui/JsonLd";
import { messages, pageMeta } from "@/lib/page-meta";
import type { Lang } from "@/lib/preferences";
import { getCategoryPage, listCategories } from "@/services/catalog.server";
import { categoryName } from "@/utils/categories";
import { breadcrumbData, itemListData } from "@/utils/structured-data";
import { categoryPath } from "@/utils/url";

export async function categoryParams() {
  const categories = await listCategories();
  return categories.map((c) => ({ slug: c.slug }));
}

export async function categoryMetadata(slug: string, lang: Lang): Promise<Metadata> {
  const page = await getCategoryPage(slug);
  if (!page) return {};
  const { seo } = messages(lang);
  const name = categoryName(page.category, lang);
  return pageMeta({ lang, path: `/category/${slug}/`, title: seo.categoryTitle(name), description: seo.categoryDescription(name), image: page.summaries[0]?.product.images?.[0] });
}

// ফিল্টার ব্রাউজারে চালু হওয়ার আগে Suspense এর fallback হিসেবে পণ্যের লিস্ট স্ট্যাটিক HTML এ থাকে
export async function CategoryPage({ slug, lang }: { slug: string; lang: Lang }) {
  const page = await getCategoryPage(slug);
  if (!page) notFound();
  const t = messages(lang);
  const prefix = lang === "en" ? "/en" : "";
  const name = categoryName(page.category, lang);
  const crumbs = [
    { name: t.nav.home, path: `${prefix}/` },
    { name, path: categoryPath(prefix, slug) },
  ];
  return (
    <>
      <JsonLd data={[breadcrumbData(crumbs), itemListData(page.summaries.slice(0, 24).map((s) => s.product), prefix)]} />
      <Suspense fallback={<StaticResults t={t} prefix={prefix} title={name} summaries={page.summaries} />}>
        <SearchView category={slug} initial={page.summaries} />
      </Suspense>
    </>
  );
}
