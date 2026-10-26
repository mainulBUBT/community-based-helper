import type { Lang } from "@/lib/preferences";
import type { Messages } from "@/i18n/bn";
import type { CategoryInfo, Condition } from "@/types/catalog";

export const categoryName = (category: CategoryInfo | undefined, lang: Lang) => (category ? (lang === "en" ? category.nameEn : category.name) : "");

export const categoryFamily = (categories: CategoryInfo[], slug: string) => [slug, ...categories.filter((c) => c.parent === slug).map((c) => c.slug)];

export const DEFAULT_CONDITIONS: Condition[] = ["official", "unofficial"];

export const categoryConditions = (category: CategoryInfo | undefined) => (category?.conditions?.length ? category.conditions : DEFAULT_CONDITIONS);

export const isReplica = (condition: Condition) => condition === "replica" || condition === "replica_premium";

// ওয়ারেন্টি নেই এমন ক্যাটাগরিতে (জুতা) official মানে আসল পণ্য, "ব্র্যান্ড ওয়ারেন্টি" নয়
export const conditionLabel = (t: Messages, condition: Condition, warranty: boolean) => (condition === "official" && !warranty ? t.conditionOriginal : t.condition[condition]);
