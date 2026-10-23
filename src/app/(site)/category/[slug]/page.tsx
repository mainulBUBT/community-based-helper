import type { Metadata } from "next";
import { Suspense } from "react";
import { CategoryView } from "@/app/(site)/category/CategoryView";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { toEnPath } from "@/lib/en-meta";
import { listCategories, listSummaries } from "@/services/catalog.server";

export async function generateStaticParams() {
  const categories = await listCategories();
  return categories.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const categories = await listCategories();
  const category = categories.find((c) => c.slug === slug);
  if (!category) {
    return { title: "ক্যাটাগরি পাওয়া যায়নি", robots: { index: false } };
  }
  const title = category.name;
  const description = `${category.name} — বাংলাদেশের বিভিন্ন দোকানের দাম পাশাপাশি তুলনা করুন।`;
  return {
    title,
    description,
    alternates: { canonical: `/category/${slug}/`, languages: { bn: `/category/${slug}/`, en: toEnPath(`/category/${slug}/`) } },
  };
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return (
    <Suspense fallback={<ListSkeleton />}>
      <CategoryView slug={slug} />
    </Suspense>
  );
}