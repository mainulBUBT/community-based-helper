import type { Metadata } from "next";
import { SavedView } from "./SavedView";

export const metadata: Metadata = { title: "সেভ করা", robots: { index: false } };

export default function SavedPage() {
  return <SavedView />;
}
