import { SearchX } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { RootDocument } from "@/components/layout/RootDocument";
import { EmptyState } from "@/components/ui/EmptyState";
import { bn } from "@/i18n/bn";
import { en } from "@/i18n/en";
import { getSiteSettings, listCategories } from "@/services/catalog.server";

export const metadata: Metadata = { title: `${bn.notFound.title} | ${en.notFound.title}`, robots: { index: false } };

// কোন ভাষার ঠিকানা ভুল তা জানা যায় না, তাই দুই ভাষাতেই
export default async function GlobalNotFound() {
  const [settings, categories] = await Promise.all([getSiteSettings(), listCategories()]);
  return (
    <RootDocument lang="bn">
      <AppShell settings={settings} categories={categories}>
        <EmptyState icon={SearchX} title={bn.notFound.title}>
          <p lang="en" className="text-sm text-dim">
            {en.notFound.title}
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Link href="/" className="flex h-11 items-center rounded-md bg-brand px-5 font-bold text-brand-ink">
              {bn.notFound.cta}
            </Link>
            <Link href="/en/" lang="en" className="flex h-11 items-center rounded-md border border-line px-5 font-semibold">
              {en.notFound.cta}
            </Link>
          </div>
        </EmptyState>
      </AppShell>
    </RootDocument>
  );
}
