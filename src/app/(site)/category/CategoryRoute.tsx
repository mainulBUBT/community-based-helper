import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { SearchView } from "@/app/(site)/search/SearchView";
import { StaticResults } from "@/components/search/StaticResults";
import { JsonLd } from "@/components/ui/JsonLd";
import { messages, pageMeta } from "@/lib/page-meta";
import type { Lang } from "@/lib/preferences";
import { getCategoryPage, listBudgets, listCategories } from "@/services/catalog.server";
import { budgetSlug } from "@/config/budgets";
import { categoryName } from "@/utils/categories";
import { formatTaka } from "@/utils/format";
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
  return pageMeta({ lang, path: `/category/${slug}/`, title: seo.categoryTitle(name), shortTitle: seo.categoryShortTitle(name), description: seo.categoryDescription(name), image: page.summaries[0]?.product.images?.[0] });
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
  const budgets = await listBudgets(slug);
  // বাজেটের পাতায় যাওয়ার লিংক: খোঁজার ইঞ্জিনও এখান থেকে পাতাগুলো খুঁজে পায়
  const budgetLinks = budgets.length > 0 && (
    <nav aria-label={t.budget.links} className="no-scrollbar -mx-4 flex items-center gap-2 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:px-0">
      <span className="shrink-0 text-xs font-semibold text-faint">{t.budget.links}:</span>
      {budgets.map((b) => (
        <Link key={b.budget} href={`${categoryPath(prefix, slug)}${budgetSlug(b.budget)}/`} className="shrink-0 rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-ink hover:border-brand hover:text-brand">
          {t.budget.chip(lang === "bn" ? formatTaka(b.budget, lang).replace("৳", "") : formatTaka(b.budget, lang))}
        </Link>
      ))}
    </nav>
  );
  return (
    <>
      <JsonLd data={[breadcrumbData(crumbs), itemListData(page.summaries.slice(0, 24).map((s) => s.product), prefix)]} />
      <Suspense fallback={<StaticResults t={t} prefix={prefix} title={name} summaries={page.summaries} extra={budgetLinks} />}>
        <SearchView category={slug} initial={page.summaries} extra={budgetLinks} />
      </Suspense>
    </>
  );
}
