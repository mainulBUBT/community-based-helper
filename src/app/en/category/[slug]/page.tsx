import type { Metadata } from "next";
import { Suspense } from "react";
import { CategoryView } from "@/app/(site)/category/CategoryView";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { enMeta } from "@/lib/en-meta";
import { getSiteSettings, listCategories } from "@/services/catalog.server";

export async function generateStaticParams() {
  const categories = await listCategories();
  return categories.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const categories = await listCategories();
  const category = categories.find((c) => c.slug === slug);
  if (!category) {
    return { title: "Category not found", robots: { index: false } };
  }
  return enMeta({
    title: category.nameEn || category.name,
    description: `${category.nameEn || category.name} — compare prices from shops across Bangladesh, side by side.`,
    path: `/en/category/${slug}/`,
    settings: await getSiteSettings(),
  });
}

export default async function EnCategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <Suspense fallback={<ListSkeleton />}>
      <CategoryView slug={(await params).slug} />
    </Suspense>
  );
}