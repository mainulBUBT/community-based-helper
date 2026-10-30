import type { Metadata } from "next";
import { InfoPage } from "@/components/ui/InfoPage";
import { messages, pageMeta } from "@/lib/page-meta";

export const generateMetadata = (): Promise<Metadata> => pageMeta({ lang: "bn", path: "/privacy/", ...messages("bn").seo.privacy });

export default function Page() {
  const t = messages("bn").privacy;
  return <InfoPage title={t.title} sections={t.sections} />;
}
