import type { Metadata } from "next";
import { HomeView } from "@/app/(site)/HomeView";
import { enMeta } from "@/lib/en-meta";
import { getSiteSettings, listSellers, listSummaries } from "@/services/catalog";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return enMeta({
    title: settings.seoTitleEn,
    description: settings.seoDescriptionEn,
    path: "/en/",
    settings,
    absolute: true,
  });
}

export default async function EnHomePage() {
  const [summaries, sellers, settings] = await Promise.all([listSummaries(), listSellers(), getSiteSettings()]);
  return <HomeView initial={{ summaries, sellers, settings }} />;
}
