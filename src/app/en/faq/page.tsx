import type { Metadata } from "next";
import { InfoPage } from "@/components/ui/InfoPage";
import { messages, pageMeta } from "@/lib/page-meta";

export const generateMetadata = (): Promise<Metadata> => pageMeta({ lang: "en", path: "/faq/", ...messages("en").seo.faq });

export default function Page() {
  const t = messages("en").faq;
  return <InfoPage title={t.title} intro={t.intro} sections={t.items.map(({ q, a }) => ({ title: q, body: [a] }))} />;
}
