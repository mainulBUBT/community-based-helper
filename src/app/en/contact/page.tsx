import type { Metadata } from "next";
import { ContactView } from "@/app/(site)/contact/ContactView";
import { messages, pageMeta } from "@/lib/page-meta";
import { getSiteSettings } from "@/services/catalog.server";

export const generateMetadata = (): Promise<Metadata> => pageMeta({ lang: "en", path: "/contact/", ...messages("en").seo.contact });

export default async function Page() {
  return <ContactView settings={await getSiteSettings()} t={messages("en").contact} shopsNote={messages("en").about.shopsNote} />;
}
