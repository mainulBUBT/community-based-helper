import type { Metadata } from "next";
import { AboutView } from "@/app/(site)/about/AboutView";
import { enMeta } from "@/lib/en-meta";
import { getSiteSettings } from "@/services/catalog";

export async function generateMetadata(): Promise<Metadata> {
  return enMeta({
    title: "About Us",
    description: "How this site works, where the prices come from, and how to reach us.",
    path: "/en/about/",
    settings: await getSiteSettings(),
  });
}

export default async function EnAboutPage() {
  return <AboutView settings={await getSiteSettings()} />;
}
