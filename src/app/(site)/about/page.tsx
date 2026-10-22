import type { Metadata } from "next";
import { toEnPath } from "@/lib/en-meta";
import { getSiteSettings } from "@/services/catalog.server";
import { AboutView } from "./AboutView";

export const metadata: Metadata = {
  title: "আমাদের সম্পর্কে",
  description: "এই সাইট কীভাবে কাজ করে, দাম কোথা থেকে আসে, কীভাবে যোগাযোগ করবেন।",
  alternates: { canonical: "/about/", languages: { bn: "/about/", en: toEnPath("/about/") } },
};

export default async function AboutPage() {
  return <AboutView settings={await getSiteSettings()} />;
}
