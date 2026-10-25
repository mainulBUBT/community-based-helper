import type { Metadata } from "next";
import { SellersView } from "@/app/(site)/sellers/SellersView";
import { messages, pageMeta } from "@/lib/page-meta";
import { listSellers } from "@/services/catalog.server";

export const generateMetadata = (): Promise<Metadata> => pageMeta({ lang: "en", path: "/sellers/", ...messages("en").seo.sellers });

export default async function Page() {
  return <SellersView initial={await listSellers()} />;
}
