import { loadSampleCatalog, sampleCategories } from "@/data/sample";
import { supabase } from "@/lib/supabase";
import type { CategoryInfo } from "@/types/catalog";
import { categoryConditions } from "@/utils/categories";
import { loadCatalog } from "../catalog-live";
import { toCategory } from "../mappers";
import { logAction } from "./audit";

export async function listAllCategories(): Promise<CategoryInfo[]> {
  if (!supabase) return [...sampleCategories].sort((a, b) => a.position - b.position);
  const { data, error } = await supabase.from("categories").select("*").order("position");
  if (error) throw error;
  return data.map(toCategory);
}

// নতুন সাব-ক্যাটাগরি মূল ভাগের ওয়ারেন্টি নেয় (স্কিনকেয়ারের নিচে নতুন ভাগেও ওয়ারেন্টি নেই)
async function inheritWarranty(category: CategoryInfo): Promise<CategoryInfo> {
  if (category.warranty !== undefined || !category.parent) return category;
  const parent = (await listAllCategories()).find((c) => c.slug === category.parent);
  return { ...category, warranty: parent?.warranty !== false };
}

export async function saveCategory(input: CategoryInfo, isNew: boolean) {
  const category = isNew ? await inheritWarranty(input) : input;
  if (!supabase) {
    if (isNew) sampleCategories.push(category);
    else Object.assign(sampleCategories.find((c) => c.slug === category.slug)!, category);
  } else {
    const row = {
      slug: category.slug,
      name: category.name,
      name_en: category.nameEn,
      icon: category.icon,
      parent: category.parent ?? null,
      variant_axes: category.axes,
      position: category.position,
      active: category.active,
      warranty: category.warranty !== false,
      conditions: categoryConditions(category),
      verify_note: category.verifyNote === true,
      quality_note: category.qualityNote === true,
    };
    const { error } = isNew ? await supabase.from("categories").insert(row) : await supabase.from("categories").update(row).eq("slug", category.slug);
    if (error) throw error;
  }
  await loadCatalog(true);
  await logAction(isNew ? "category.create" : "category.update", { slug: category.slug });
}

export async function countProducts(slug: string) {
  if (!supabase) return (await loadSampleCatalog()).sampleProducts.filter((p) => p.category === slug).length;
  const { count, error } = await supabase.from("products").select("id", { count: "exact", head: true }).eq("category", slug);
  if (error) throw error;
  return count ?? 0;
}

export async function countChildren(slug: string) {
  if (!supabase) return sampleCategories.filter((c) => c.parent === slug).length;
  const { count, error } = await supabase.from("categories").select("slug", { count: "exact", head: true }).eq("parent", slug);
  if (error) throw error;
  return count ?? 0;
}

export async function deleteCategory(category: CategoryInfo) {
  if ((await countProducts(category.slug)) > 0) throw new Error("category has products");
  if ((await countChildren(category.slug)) > 0) throw new Error("category has children");
  if (!supabase) sampleCategories.splice(sampleCategories.findIndex((c) => c.slug === category.slug), 1);
  else {
    const { error } = await supabase.from("categories").delete().eq("slug", category.slug);
    if (error) throw error;
  }
  await loadCatalog(true);
  await logAction("category.delete", { slug: category.slug });
}
