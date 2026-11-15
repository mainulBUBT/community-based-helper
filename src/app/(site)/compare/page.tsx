import type { Metadata } from "next";
import { Suspense } from "react";
import { CompareView } from "@/app/(site)/compare/CompareView";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { messages, pageMeta } from "@/lib/page-meta";

export const generateMetadata = (): Promise<Metadata> => pageMeta({ lang: "bn", path: "/compare/", ...messages("bn").seo.compare, index: false });

export default function Page() {
  return (
    <Suspense fallback={<ListSkeleton />}>
      <CompareView />
    </Suspense>
  );
}
