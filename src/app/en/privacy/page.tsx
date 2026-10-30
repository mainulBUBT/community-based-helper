import type { Metadata } from "next";
import { InfoPage } from "@/components/ui/InfoPage";
import { messages, pageMeta } from "@/lib/page-meta";

export const generateMetadata = (): Promise<Metadata> => pageMeta({ lang: "en", path: "/privacy/", ...messages("en").seo.privacy });

export default function Page() {
  const t = messages("en").privacy;
  return <InfoPage title={t.title} sections={t.sections} />;
}
