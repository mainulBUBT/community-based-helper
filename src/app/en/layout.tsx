import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { LocaleProvider } from "@/lib/locale";
import { getSiteSettings } from "@/services/catalog";

export default async function EnLayout({ children }: { children: ReactNode }) {
  return (
    <LocaleProvider lang="en">
      <AppShell settings={await getSiteSettings()}>{children}</AppShell>
    </LocaleProvider>
  );
}
