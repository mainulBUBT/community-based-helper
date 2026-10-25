import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/ui/JsonLd";
import { messages, pageMeta } from "@/lib/page-meta";
import type { Lang } from "@/lib/preferences";
import { getProductDetail, getSiteSettings, loadCatalog } from "@/services/catalog.server";
import type { ProductDetail } from "@/types/catalog";
import { categoryName } from "@/utils/categories";
import { formatTaka } from "@/utils/format";
import { breadcrumbData, productData } from "@/utils/structured-data";
import { categoryPath } from "@/utils/url";
import { ProductView } from "./ProductView";

// bn আর en দুই রুট একই কাজ করে, শুধু ভাষা আলাদা
export async function productParams() {
  const { products } = await loadCatalog();
  return products.map((p) => ({ slug: p.slug }));
}

function describe({ product, offers }: ProductDetail, lang: Lang) {
  const { seo } = messages(lang);
  const name = `${product.brand} ${product.name}`;
  const lowest = offers[0]?.price;
  return lowest ? seo.productFrom(name, formatTaka(lowest, lang), offers.length) : seo.productNoPrice(name);
}

export async function productMetadata(slug: string, lang: Lang): Promise<Metadata> {
  const detail = await getProductDetail(slug);
  if (!detail) return {};
  const { seo } = messages(lang);
  const { product } = detail;
  const name = `${product.brand} ${product.name}`;
  return pageMeta({
    lang,
    path: `/product/${product.slug}/`,
    title: seo.productTitle(name),
    shortTitle: seo.productShortTitle(name),
    description: describe(detail, lang),
    image: product.images?.[0],
  });
}

export async function ProductPage({ slug, lang }: { slug: string; lang: Lang }) {
  const detail = await getProductDetail(slug);
  if (!detail) notFound();
  const { regionNotes } = await getSiteSettings();
  const { product, offers, category } = detail;
  const about = (lang === "en" ? product.descriptionEn || product.description : product.description || product.descriptionEn) || describe(detail, lang);
  const prefix = lang === "en" ? "/en" : "";
  const path = `${prefix}/product/${product.slug}/`;
  const crumbs = [
    { name: messages(lang).nav.home, path: `${prefix}/` },
    ...(category ? [{ name: categoryName(category, lang), path: categoryPath(prefix, category.slug) }] : []),
    { name: `${product.brand} ${product.name}`, path },
  ];
  return (
    <>
      {/* দাম না থাকলে Product ডেটা Google এর নিয়মে অসম্পূর্ণ, তখন শুধু breadcrumb */}
      <JsonLd data={offers.length ? [productData(product, offers, path, about), breadcrumbData(crumbs)] : breadcrumbData(crumbs)} />
      <ProductView initial={detail} regionNotes={regionNotes} />
    </>
  );
}
