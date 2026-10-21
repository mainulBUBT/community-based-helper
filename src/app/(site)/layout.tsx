import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { getSiteSettings, listCategories } from "@/services/catalog";

export default async function SiteLayout({ children }: { children: ReactNode }) {
  const [settings, categories] = await Promise.all([getSiteSettings(), listCategories()]);
  return (
    <AppShell settings={settings} categories={categories}>
      {children}
    </AppShell>
  );
}
