import type { Metadata } from "next";
import { SavedView } from "@/app/(site)/saved/SavedView";
import { messages, pageMeta } from "@/lib/page-meta";

export const generateMetadata = (): Promise<Metadata> => pageMeta({ lang: "en", path: "/saved/", ...messages("en").seo.saved, index: false });

export default function Page() {
  return <SavedView />;
}
