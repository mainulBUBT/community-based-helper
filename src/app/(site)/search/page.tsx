import type { Metadata } from "next";
import { Suspense } from "react";
import { preload } from "react-dom";
import { SearchView } from "@/app/(site)/search/SearchView";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { messages, pageMeta } from "@/lib/page-meta";
import { SUMMARIES_URL } from "@/services/catalog";

export const generateMetadata = (): Promise<Metadata> => pageMeta({ lang: "bn", path: "/search/", ...messages("bn").seo.search, index: false });

export default function Page() {
  // ফলের ডেটা JavaScript চালু হওয়ার অপেক্ষা না করে সাথে সাথে নামা শুরু করে
  preload(SUMMARIES_URL, { as: "fetch", crossOrigin: "anonymous" });
  return (
    <Suspense fallback={<ListSkeleton />}>
      <SearchView />
    </Suspense>
  );
}
