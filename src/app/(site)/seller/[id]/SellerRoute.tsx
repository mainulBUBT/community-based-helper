import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/ui/JsonLd";
import { messages, pageMeta } from "@/lib/page-meta";
import type { Lang } from "@/lib/preferences";
import { getSellerDetail, listCategories, loadCatalog } from "@/services/catalog.server";
import { categoryName } from "@/utils/categories";
import { toBnDigits } from "@/utils/format";
import { breadcrumbData, sellerData } from "@/utils/structured-data";
import { SellerView } from "./SellerView";

export async function sellerParams() {
  const { sellers } = await loadCatalog();
  return sellers.map((s) => ({ id: s.id }));
}

export async function sellerMetadata(id: string, lang: Lang): Promise<Metadata> {
  const [detail, categories] = await Promise.all([getSellerDetail(id), listCategories()]);
  if (!detail) return {};
  const t = messages(lang);
  const { seller, listings } = detail;
  const products = [...new Set(listings.map(({ product }) => `${product.brand} ${product.name}`))];
  const count = lang === "bn" ? toBnDigits(products.length) : String(products.length);
  // Google ~১৬০ অক্ষর দেখায়, তাই যতগুলো উদাহরণ ধরে ততগুলোই
  const description = products.length
    ? [3, 2, 1, 0].map((n) => t.seo.sellerListings(seller.name, count, products.slice(0, n).join(", "))).find((text) => text.length <= 160)!
    : t.seo.sellerDescription(seller.name, t.sellerKind[seller.kind], seller.area);
  const perCategory = new Map<string, Set<string>>();
  for (const { product } of listings) perCategory.set(product.category, (perCategory.get(product.category) ?? new Set()).add(product.id));
  const kinds = [...perCategory]
    .sort((a, b) => b[1].size - a[1].size)
    .slice(0, 2)
    .map(([slug]) => categoryName(categories.find((c) => c.slug === slug), lang))
    .filter(Boolean);
  const month = new Date().toLocaleDateString(lang === "bn" ? "bn-BD" : "en-GB", { month: "long", year: "numeric" });
  const [title, ...shortTitle] = t.seo.sellerTitles(seller.name, kinds.length ? kinds.join(t.seo.and) : null, month);
  return pageMeta({
    lang,
    path: `/seller/${seller.id}/`,
    title,
    shortTitle,
    description,
    image: seller.logo ?? listings[0]?.product.images?.[0],
  });
}

export async function SellerPage({ id, lang = "bn" }: { id: string; lang?: Lang }) {
  const detail = await getSellerDetail(id);
  if (!detail) notFound();
  const t = messages(lang);
  const prefix = lang === "en" ? "/en" : "";
  const path = `${prefix}/seller/${detail.seller.id}/`;
  const crumbs = [
    { name: t.nav.home, path: `${prefix}/` },
    { name: t.nav.sellers, path: `${prefix}/sellers/` },
    { name: detail.seller.name, path },
  ];
  return (
    <>
      <JsonLd data={[sellerData(detail.seller, path), breadcrumbData(crumbs)]} />
      <SellerView initial={detail} />
    </>
  );
}
