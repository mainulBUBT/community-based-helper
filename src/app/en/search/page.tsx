import type { Metadata } from "next";
import { Suspense } from "react";
import { SearchView } from "@/app/(site)/search/SearchView";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { enMeta } from "@/lib/en-meta";
import { getSiteSettings } from "@/services/catalog";

export async function generateMetadata(): Promise<Metadata> {
  return enMeta({
    title: "Find Prices",
    description: "Search mobile, iPhone, MacBook and smartwatch prices by model.",
    path: "/en/search/",
    settings: await getSiteSettings(),
  });
}

export default function EnSearchPage() {
  return (
    <Suspense fallback={<ListSkeleton />}>
      <SearchView />
    </Suspense>
  );
}
