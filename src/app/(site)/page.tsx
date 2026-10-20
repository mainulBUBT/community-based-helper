import { getSiteSettings, listSellers, listSummaries } from "@/services/catalog";
import { HomeView } from "./HomeView";

export default async function HomePage() {
  const [summaries, sellers, settings] = await Promise.all([listSummaries(), listSellers(), getSiteSettings()]);
  return <HomeView initial={{ summaries, sellers, settings }} />;
}
