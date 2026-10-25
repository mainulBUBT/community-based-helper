import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { RootDocument } from "@/components/layout/RootDocument";
import { siteMetadata } from "@/lib/site-metadata";
import { getSiteSettings, listCategories } from "@/services/catalog.server";

export { viewport } from "@/lib/site-metadata";

export const generateMetadata = (): Promise<Metadata> => siteMetadata("bn");

export default async function SiteLayout({ children }: { children: ReactNode }) {
  const [settings, categories] = await Promise.all([getSiteSettings(), listCategories()]);
  return (
    <RootDocument lang="bn">
      <AppShell settings={settings} categories={categories}>
        {children}
      </AppShell>
    </RootDocument>
  );
}
