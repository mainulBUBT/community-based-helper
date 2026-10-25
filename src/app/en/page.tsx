import type { Metadata } from "next";
import { HomeView } from "@/app/(site)/HomeView";
import { JsonLd } from "@/components/ui/JsonLd";
import { pageMeta } from "@/lib/page-meta";
import { getHomeData } from "@/services/catalog.server";
import { websiteData } from "@/utils/structured-data";

export const generateMetadata = (): Promise<Metadata> => pageMeta({ lang: "en", path: "/" });

export default async function Page() {
  const home = await getHomeData();
  const name = (home.settings.nameEn || home.settings.name);
  return (
    <>
      <JsonLd data={websiteData(name, "/en")} />
      <HomeView initial={home} />
    </>
  );
}
