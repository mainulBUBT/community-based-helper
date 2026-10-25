import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { RootDocument } from "@/components/layout/RootDocument";
import { LocaleProvider } from "@/lib/locale";
import { siteMetadata } from "@/lib/site-metadata";
import { getSiteSettings, listCategories } from "@/services/catalog.server";

export { viewport } from "@/lib/site-metadata";

export const generateMetadata = (): Promise<Metadata> => siteMetadata("en");

export default async function EnLayout({ children }: { children: ReactNode }) {
  const [settings, categories] = await Promise.all([getSiteSettings(), listCategories()]);
  return (
    <RootDocument lang="en">
      <LocaleProvider lang="en">
        <AppShell settings={settings} categories={categories}>
          {children}
        </AppShell>
      </LocaleProvider>
    </RootDocument>
  );
}
