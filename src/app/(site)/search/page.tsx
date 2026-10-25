import type { Metadata } from "next";
import { Suspense } from "react";
import { SearchView } from "@/app/(site)/search/SearchView";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { messages, pageMeta } from "@/lib/page-meta";

export const generateMetadata = (): Promise<Metadata> => pageMeta({ lang: "bn", path: "/search/", ...messages("bn").seo.search, index: false });

export default function Page() {
  return (
    <Suspense fallback={<ListSkeleton />}>
      <SearchView />
    </Suspense>
  );
}
