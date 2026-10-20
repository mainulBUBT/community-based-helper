import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { getSiteSettings } from "@/services/catalog";

export default async function SiteLayout({ children }: { children: ReactNode }) {
  return <AppShell settings={await getSiteSettings()}>{children}</AppShell>;
}
