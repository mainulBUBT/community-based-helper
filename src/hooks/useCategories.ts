"use client";

import { useCategoryList } from "@/lib/categories";
import type { Lang } from "@/lib/preferences";
import type { CategoryInfo } from "@/types/catalog";
import { useI18n } from "./useI18n";

export const categoryName = (category: CategoryInfo | undefined, lang: Lang) => (category ? (lang === "en" ? category.nameEn : category.name) : "");

export const categoryFamily = (categories: CategoryInfo[], slug: string) => [slug, ...categories.filter((c) => c.parent === slug).map((c) => c.slug)];

export function useCategories() {
  const { lang } = useI18n();
  const categories = useCategoryList();
  const find = (slug: string | null | undefined) => categories.find((c) => c.slug === slug);
  return {
    categories,
    top: categories.filter((c) => !c.parent),
    childrenOf: (slug: string) => categories.filter((c) => c.parent === slug),
    family: (slug: string) => categoryFamily(categories, slug),
    find,
    name: (slug: string | null | undefined) => categoryName(find(slug), lang) || slug || "",
  };
}
