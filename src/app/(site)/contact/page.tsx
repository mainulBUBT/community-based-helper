import type { Metadata } from "next";
import { ContactView } from "@/app/(site)/contact/ContactView";
import { messages, pageMeta } from "@/lib/page-meta";
import { getSiteSettings } from "@/services/catalog.server";

export const generateMetadata = (): Promise<Metadata> => pageMeta({ lang: "bn", path: "/contact/", ...messages("bn").seo.contact });

export default async function Page() {
  return <ContactView settings={await getSiteSettings()} t={messages("bn").contact} shopsNote={messages("bn").about.shopsNote} />;
}
