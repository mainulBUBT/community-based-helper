import type { Metadata } from "next";
import { OfflineNotice } from "@/components/ui/Notices";

export const metadata: Metadata = { title: "ইন্টারনেট নেই", robots: { index: false } };

export default function OfflinePage() {
  return <OfflineNotice />;
}
