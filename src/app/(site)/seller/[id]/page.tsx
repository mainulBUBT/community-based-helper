import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SELLER_KIND_LABEL } from "@/config/site";
import { toEnPath } from "@/lib/en-meta";
import { getSellerDetail, loadCatalog } from "@/services/catalog.server";
import { SellerView } from "./SellerView";

interface Props {
  params: Promise<{ id: string }>;
}

export const dynamicParams = false;

export async function generateStaticParams() {
  const { sellers } = await loadCatalog();
  return sellers.map((s) => ({ id: s.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const detail = await getSellerDetail((await params).id);
  if (!detail) return {};
  const { seller } = detail;
  const where = seller.area ? `, ${seller.area}` : "";
  return {
    title: `${seller.name}${where}`,
    description: `${seller.name} (${SELLER_KIND_LABEL[seller.kind]}${where}) এ কোন পণ্য কত দামে পাওয়া যায়, দেখুন।`,
    alternates: { canonical: `/seller/${seller.id}/`, languages: { bn: `/seller/${seller.id}/`, en: toEnPath(`/seller/${seller.id}/`) } },
  };
}

export default async function SellerPage({ params }: Props) {
  const detail = await getSellerDetail((await params).id);
  if (!detail) notFound();
  return <SellerView initial={detail} />;
}
