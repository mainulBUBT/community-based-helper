import type { Metadata } from "next";
import { InfoPage } from "@/components/ui/InfoPage";
import { messages, pageMeta } from "@/lib/page-meta";

export const generateMetadata = (): Promise<Metadata> => pageMeta({ lang: "bn", path: "/terms/", ...messages("bn").seo.terms });

export default function Page() {
  const t = messages("bn").terms;
  return <InfoPage title={t.title} sections={t.sections} />;
}
