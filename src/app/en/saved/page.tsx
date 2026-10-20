import type { Metadata } from "next";
import { SavedView } from "@/app/(site)/saved/SavedView";
import { enMeta } from "@/lib/en-meta";
import { getSiteSettings } from "@/services/catalog";

export async function generateMetadata(): Promise<Metadata> {
  return enMeta({
    title: "Saved",
    description: "Products you saved to compare later.",
    path: "/en/saved/",
    settings: await getSiteSettings(),
    index: false,
  });
}

export default function EnSavedPage() {
  return <SavedView />;
}
