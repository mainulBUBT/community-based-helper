import type { Metadata } from "next";
import { InfoPage } from "@/components/ui/InfoPage";
import { JsonLd } from "@/components/ui/JsonLd";
import { messages, pageMeta } from "@/lib/page-meta";
import { breadcrumbData, faqData } from "@/utils/structured-data";

export const generateMetadata = (): Promise<Metadata> => pageMeta({ lang: "bn", path: "/faq/", ...messages("bn").seo.faq });

export default function Page() {
  const m = messages("bn");
  const t = m.faq;
  const crumbs = [
    { name: m.nav.home, path: "/" },
    { name: t.title, path: "/faq/" },
  ];
  return (
    <>
      <JsonLd data={[faqData(t.items), breadcrumbData(crumbs)]} />
      <InfoPage title={t.title} intro={t.intro} sections={t.items.map(({ q, a }) => ({ title: q, body: [a] }))} />
    </>
  );
}
