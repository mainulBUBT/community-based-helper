"use client";

import { useCategoryList } from "@/lib/categories";
import { categoryFamily, categoryName } from "@/utils/categories";
import { useI18n } from "./useI18n";

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
    warranty: (slug: string | null | undefined) => find(slug)?.warranty !== false,
  };
}
