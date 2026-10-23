import type { Metadata } from "next";
import { HomeView } from "@/app/(site)/HomeView";
import { enMeta } from "@/lib/en-meta";
import { getSiteSettings, listComparisons, listSellers, listSummaries } from "@/services/catalog.server";

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
  const [summaries, sellers, settings, comparison] = await Promise.all([
    listSummaries(),
    listSellers(),
    getSiteSettings(),
    listComparisons(),
  ]);
  return <HomeView initial={{ summaries, sellers, settings, comparison }} />;
}
