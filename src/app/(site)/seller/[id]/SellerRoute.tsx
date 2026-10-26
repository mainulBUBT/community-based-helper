import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { messages, pageMeta } from "@/lib/page-meta";
import type { Lang } from "@/lib/preferences";
import { getSellerDetail, loadCatalog } from "@/services/catalog.server";
import { toBnDigits } from "@/utils/format";
import { SellerView } from "./SellerView";

export async function sellerParams() {
  const { sellers } = await loadCatalog();
  return sellers.map((s) => ({ id: s.id }));
}

export async function sellerMetadata(id: string, lang: Lang): Promise<Metadata> {
  const detail = await getSellerDetail(id);
  if (!detail) return {};
  const t = messages(lang);
  const { seller, listings } = detail;
  const products = [...new Set(listings.map(({ product }) => `${product.brand} ${product.name}`))];
  const count = lang === "bn" ? toBnDigits(products.length) : String(products.length);
  // Google ~১৬০ অক্ষর দেখায়, তাই যতগুলো উদাহরণ ধরে ততগুলোই
  const description = products.length
    ? [3, 2, 1, 0].map((n) => t.seo.sellerListings(seller.name, count, products.slice(0, n).join(", "))).find((text) => text.length <= 160)!
    : t.seo.sellerDescription(seller.name, t.sellerKind[seller.kind], seller.area);
  return pageMeta({
    lang,
    path: `/seller/${seller.id}/`,
    title: t.seo.sellerTitle(seller.name, seller.area),
    description,
  });
}

export async function SellerPage({ id }: { id: string }) {
  const detail = await getSellerDetail(id);
  if (!detail) notFound();
  return <SellerView initial={detail} />;
}
