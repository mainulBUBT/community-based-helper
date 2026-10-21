"use client";

import { DEFAULT_CATEGORIES } from "@/config/site";
import { listAllCategories } from "@/services/admin/categories";
import { useAsync } from "./useAsync";

export function useAdminCategories() {
  const { data, reload } = useAsync(listAllCategories, []);
  return { categories: data ?? DEFAULT_CATEGORIES, reload };
}
