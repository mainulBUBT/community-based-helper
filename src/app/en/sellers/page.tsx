import type { Metadata } from "next";
import { SellersView } from "@/app/(site)/sellers/SellersView";
import { enMeta } from "@/lib/en-meta";
import { getSiteSettings, listSellers } from "@/services/catalog.server";

export async function generateMetadata(): Promise<Metadata> {
  return enMeta({
    title: "Sellers",
    description: "Online stores, market shops and Facebook group sellers, and who is verified.",
    path: "/en/sellers/",
    settings: await getSiteSettings(),
  });
}

export default async function EnSellersPage() {
  return <SellersView initial={await listSellers()} />;
}
