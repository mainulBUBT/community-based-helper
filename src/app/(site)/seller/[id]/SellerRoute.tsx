import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { messages, pageMeta } from "@/lib/page-meta";
import type { Lang } from "@/lib/preferences";
import { getSellerDetail, loadCatalog } from "@/services/catalog.server";
import { SellerView } from "./SellerView";

export async function sellerParams() {
  const { sellers } = await loadCatalog();
  return sellers.map((s) => ({ id: s.id }));
}

export async function sellerMetadata(id: string, lang: Lang): Promise<Metadata> {
  const detail = await getSellerDetail(id);
  if (!detail) return {};
  const t = messages(lang);
  const { seller } = detail;
  return pageMeta({
    lang,
    path: `/seller/${seller.id}/`,
    title: t.seo.sellerTitle(seller.name, seller.area),
    description: t.seo.sellerDescription(seller.name, t.sellerKind[seller.kind], seller.area),
  });
}

export async function SellerPage({ id }: { id: string }) {
  const detail = await getSellerDetail(id);
  if (!detail) notFound();
  return <SellerView initial={detail} />;
}
