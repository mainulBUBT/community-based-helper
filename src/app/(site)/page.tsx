import type { Metadata } from "next";
import { toEnPath } from "@/lib/en-meta";
import { getSiteSettings, listComparisons, listSellers, listSummaries } from "@/services/catalog.server";
import { HomeView } from "./HomeView";

export async function generateMetadata(): Promise<Metadata> {
  return { alternates: { canonical: "/", languages: { bn: "/", en: toEnPath("/") } } };
}

export default async function HomePage() {
  const [summaries, sellers, settings, comparison] = await Promise.all([
    listSummaries(),
    listSellers(),
    getSiteSettings(),
    listComparisons(),
  ]);
  return <HomeView initial={{ summaries, sellers, settings, comparison }} />;
}
