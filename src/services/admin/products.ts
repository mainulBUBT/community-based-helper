import { sampleOffers, sampleProducts } from "@/data/sample";
import { supabase } from "@/lib/supabase";
import type { Product, Variant } from "@/types/catalog";
import { slugify } from "@/utils/format";
import { parseVariantLabel } from "@/utils/variants";
import { listCategories, loadCatalog } from "../catalog-live";
import { logAction } from "./audit";

export interface NewProduct {
  brand: string;
  name: string;
  category: string;
  releaseYear: number | null;
  variants: { label: string; officialPrice: number | null }[];
}

export type ProductFields = Pick<Product, "brand" | "name" | "category" | "releaseYear" | "popularity"> &
  Required<Pick<Product, "images" | "colors" | "regions" | "description" | "descriptionEn" | "specs" | "specsSource">>;

async function refresh(action: string, detail: Record<string, unknown>) {
  await loadCatalog(true);
  await logAction(action, detail);
}

export async function createProduct(input: NewProduct) {
  const slug = slugify(`${input.brand} ${input.name}`);
  const axes = (await listCategories()).find((c) => c.slug === input.category)?.axes ?? [];
  const variants = input.variants.map((v) => ({ ...v, attributes: parseVariantLabel(v.label, axes) }));
  let id = `p${Date.now()}`;
  if (!supabase) {
    sampleProducts.push({
      id, slug, name: input.name, brand: input.brand, category: input.category, releaseYear: input.releaseYear, popularity: 0,
      variants: variants.map((v, i) => ({ id: `${id}v${i}`, ...v })),
    });
  } else {
    const { data, error } = await supabase
      .from("products")
      .insert({ slug, name: input.name, brand: input.brand, category: input.category, release_year: input.releaseYear })
      .select("id")
      .single();
    if (error) throw error;
    id = String(data.id);
    const rows = variants.map((v, position) => ({ product_id: data.id, label: v.label, attributes: v.attributes, official_price: v.officialPrice, position }));
    const { error: variantError } = await supabase.from("variants").insert(rows);
    if (variantError) throw variantError;
  }
  await refresh("product.create", { name: `${input.brand} ${input.name}` });
  return id;
}

export async function updateProduct(product: Product, fields: ProductFields) {
  if (!supabase) Object.assign(sampleProducts.find((p) => p.id === product.id)!, fields);
  else {
    const { error } = await supabase
      .from("products")
      .update({
        brand: fields.brand,
        name: fields.name,
        category: fields.category,
        release_year: fields.releaseYear,
        popularity: fields.popularity,
        images: fields.images,
        colors: fields.colors,
        regions: fields.regions,
        description: fields.description,
        description_en: fields.descriptionEn,
        specs: fields.specs,
        specs_source: fields.specsSource,
      })
      .eq("id", product.id);
    if (error) throw error;
  }
  await refresh("product.update", { name: `${fields.brand} ${fields.name}` });
}

export async function deleteProduct(product: Product) {
  if (!supabase) {
    const variantIds = new Set(product.variants.map((v) => v.id));
    sampleProducts.splice(sampleProducts.findIndex((p) => p.id === product.id), 1);
    for (let i = sampleOffers.length - 1; i >= 0; i--) if (variantIds.has(sampleOffers[i].variantId)) sampleOffers.splice(i, 1);
  } else {
    const { error } = await supabase.from("products").delete().eq("id", product.id);
    if (error) throw error;
  }
  await refresh("product.delete", { name: `${product.brand} ${product.name}` });
}

export async function saveVariant(product: Product, variant: Variant) {
  const isNew = !variant.id;
  if (!supabase) {
    const target = sampleProducts.find((p) => p.id === product.id)!;
    if (isNew) target.variants.push({ ...variant, id: `${product.id}v${Date.now()}` });
    else Object.assign(target.variants.find((v) => v.id === variant.id)!, variant);
  } else {
    const row = { label: variant.label, attributes: variant.attributes, sku: variant.sku ?? null, official_price: variant.officialPrice };
    const { error } = isNew
      ? await supabase.from("variants").insert({ ...row, product_id: product.id, position: product.variants.length })
      : await supabase.from("variants").update(row).eq("id", variant.id);
    if (error) throw error;
  }
  await refresh(isNew ? "variant.create" : "variant.update", { product: product.name, variant: variant.label });
}

export async function deleteVariant(product: Product, variant: Variant) {
  if (!supabase) {
    const target = sampleProducts.find((p) => p.id === product.id)!;
    target.variants.splice(target.variants.findIndex((v) => v.id === variant.id), 1);
  } else {
    const { error } = await supabase.from("variants").delete().eq("id", variant.id);
    if (error) throw error;
  }
  await refresh("variant.delete", { product: product.name, variant: variant.label });
}
