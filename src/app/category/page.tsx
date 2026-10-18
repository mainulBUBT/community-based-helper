import type { Metadata } from "next";
import { Suspense } from "react";
import { PageTransition } from "@/components/layout/PageTransition";
import { Notice } from "@/components/ui/Notice";
import { CategoryView } from "./CategoryView";

export const metadata: Metadata = { title: "বিভাগ" };

export default function CategoryPage() {
  return (
    <Suspense fallback={<Notice>লোড হচ্ছে…</Notice>}>
      <PageTransition>
        <CategoryView />
      </PageTransition>
    </Suspense>
  );
}
