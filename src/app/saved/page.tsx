import type { Metadata } from "next";
import { PageTransition } from "@/components/layout/PageTransition";
import { SavedView } from "./SavedView";

export const metadata: Metadata = { title: "সেভ করা" };

export default function SavedPage() {
  return (
    <PageTransition>
      <SavedView />
    </PageTransition>
  );
}
