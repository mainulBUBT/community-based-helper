import type { Metadata } from "next";
import { AboutView } from "@/app/(site)/about/AboutView";
import { messages, pageMeta } from "@/lib/page-meta";
import { getSiteSettings } from "@/services/catalog.server";

export const generateMetadata = (): Promise<Metadata> => pageMeta({ lang: "bn", path: "/about/", ...messages("bn").seo.about });

export default async function Page() {
  return <AboutView settings={await getSiteSettings()} />;
}
