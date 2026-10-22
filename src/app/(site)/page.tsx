import type { Metadata } from "next";
import { toEnPath } from "@/lib/en-meta";
import { getSiteSettings, listSellers, listSummaries } from "@/services/catalog.server";
import { HomeView } from "./HomeView";

export async function generateMetadata(): Promise<Metadata> {
  return { alternates: { canonical: "/", languages: { bn: "/", en: toEnPath("/") } } };
}

export default async function HomePage() {
  const [summaries, sellers, settings] = await Promise.all([listSummaries(), listSellers(), getSiteSettings()]);
  return <HomeView initial={{ summaries, sellers, settings }} />;
}
