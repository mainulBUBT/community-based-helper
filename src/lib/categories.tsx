"use client";

import { createContext, useContext, type ReactNode } from "react";
import { DEFAULT_CATEGORIES } from "@/config/site";
import type { CategoryInfo } from "@/types/catalog";

const CategoriesContext = createContext<CategoryInfo[]>(DEFAULT_CATEGORIES);

export function CategoriesProvider({ categories, children }: { categories: CategoryInfo[]; children: ReactNode }) {
  return <CategoriesContext value={categories}>{children}</CategoriesContext>;
}

export function useCategoryList() {
  return useContext(CategoriesContext);
}
