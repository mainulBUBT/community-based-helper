import type { Metadata } from "next";
import { Suspense } from "react";
import { PageTransition } from "@/components/layout/PageTransition";
import { Notice } from "@/components/ui/Notice";
import { PlaceView } from "./PlaceView";

export const metadata: Metadata = { title: "জায়গার তথ্য" };

export default function PlacePage() {
  return (
    <Suspense fallback={<Notice>লোড হচ্ছে…</Notice>}>
      <PageTransition>
        <PlaceView />
      </PageTransition>
    </Suspense>
  );
}
