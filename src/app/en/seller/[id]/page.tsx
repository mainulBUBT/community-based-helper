import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SellerView } from "@/app/(site)/seller/[id]/SellerView";
import { en } from "@/i18n/en";
import { enMeta } from "@/lib/en-meta";
import { getSellerDetail, getSiteSettings, loadCatalog } from "@/services/catalog";

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
  const where = seller.area ? ` in ${seller.area}` : "";
  return enMeta({
    title: `${seller.name}${where}`,
    description: `See what the ${en.sellerKind[seller.kind]} ${seller.name}${where} sells and at what prices.`,
    path: `/en/seller/${seller.id}/`,
    settings: await getSiteSettings(),
  });
}

export default async function EnSellerPage({ params }: Props) {
  const detail = await getSellerDetail((await params).id);
  if (!detail) notFound();
  return <SellerView initial={detail} />;
}
