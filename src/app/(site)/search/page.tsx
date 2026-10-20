import type { Metadata } from "next";
import { Suspense } from "react";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { SearchView } from "./SearchView";

export const metadata: Metadata = {
  title: "দাম খুঁজুন",
  description: "মোবাইল, iPhone, MacBook আর স্মার্টওয়াচের দাম মডেল ধরে খুঁজুন।",
};

export default function SearchPage() {
  return (
    <Suspense fallback={<ListSkeleton />}>
      <SearchView />
    </Suspense>
  );
}
