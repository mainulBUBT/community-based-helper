import type { Lang } from "@/lib/preferences";
import type { CategoryInfo } from "@/types/catalog";

export const categoryName = (category: CategoryInfo | undefined, lang: Lang) => (category ? (lang === "en" ? category.nameEn : category.name) : "");

export const categoryFamily = (categories: CategoryInfo[], slug: string) => [slug, ...categories.filter((c) => c.parent === slug).map((c) => c.slug)];
