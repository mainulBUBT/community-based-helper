import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { LocaleProvider } from "@/lib/locale";
import { getSiteSettings, listCategories } from "@/services/catalog.server";

export default async function EnLayout({ children }: { children: ReactNode }) {
  const [settings, categories] = await Promise.all([getSiteSettings(), listCategories()]);
  return (
    <LocaleProvider lang="en">
      <AppShell settings={settings} categories={categories}>
        {children}
      </AppShell>
    </LocaleProvider>
  );
}
