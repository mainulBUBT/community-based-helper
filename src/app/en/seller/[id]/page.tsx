import type { Metadata } from "next";
import { SellerPage, sellerMetadata, sellerParams } from "@/app/(site)/seller/[id]/SellerRoute";

interface Props {
  params: Promise<{ id: string }>;
}

export const dynamicParams = false;

export const generateStaticParams = sellerParams;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return sellerMetadata((await params).id, "en");
}

export default async function Page({ params }: Props) {
  return <SellerPage id={(await params).id} />;
}
