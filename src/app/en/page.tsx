import type { Metadata } from "next";
import { HomeView } from "@/app/(site)/HomeView";
import { enMeta } from "@/lib/en-meta";
import { getSiteSettings, listSellers, listSummaries } from "@/services/catalog";

export async function generateMetadata(): Promise<Metadata> {
  return enMeta({
    title: "Mobile & Gadget Prices in Bangladesh",
    description: "Compare mobile, iPhone, MacBook and smartwatch prices from shops across Bangladesh, side by side.",
    path: "/en/",
    settings: await getSiteSettings(),
  });
}

export default async function EnHomePage() {
  const [summaries, sellers, settings] = await Promise.all([listSummaries(), listSellers(), getSiteSettings()]);
  return <HomeView initial={{ summaries, sellers, settings }} />;
}
