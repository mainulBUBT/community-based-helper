import { sampleCategories, sampleProducts } from "@/data/sample";
import { supabase } from "@/lib/supabase";
import type { CategoryInfo } from "@/types/catalog";
import { loadCatalog } from "../catalog";
import { toCategory } from "../mappers";
import { logAction } from "./audit";

export async function listAllCategories(): Promise<CategoryInfo[]> {
  if (!supabase) return [...sampleCategories].sort((a, b) => a.position - b.position);
  const { data, error } = await supabase.from("categories").select("*").order("position");
  if (error) throw error;
  return data.map(toCategory);
}

export async function saveCategory(category: CategoryInfo, isNew: boolean) {
  if (!supabase) {
    if (isNew) sampleCategories.push(category);
    else Object.assign(sampleCategories.find((c) => c.slug === category.slug)!, category);
  } else {
    const row = {
      slug: category.slug,
      name: category.name,
      name_en: category.nameEn,
      icon: category.icon,
      variant_axes: category.axes,
      position: category.position,
      active: category.active,
    };
    const { error } = isNew ? await supabase.from("categories").insert(row) : await supabase.from("categories").update(row).eq("slug", category.slug);
    if (error) throw error;
  }
  await loadCatalog(true);
  await logAction(isNew ? "category.create" : "category.update", { slug: category.slug });
}

export async function countProducts(slug: string) {
  if (!supabase) return sampleProducts.filter((p) => p.category === slug).length;
  const { count, error } = await supabase.from("products").select("id", { count: "exact", head: true }).eq("category", slug);
  if (error) throw error;
  return count ?? 0;
}

export async function deleteCategory(category: CategoryInfo) {
  if ((await countProducts(category.slug)) > 0) throw new Error("category has products");
  if (!supabase) sampleCategories.splice(sampleCategories.findIndex((c) => c.slug === category.slug), 1);
  else {
    const { error } = await supabase.from("categories").delete().eq("slug", category.slug);
    if (error) throw error;
  }
  await loadCatalog(true);
  await logAction("category.delete", { slug: category.slug });
}
