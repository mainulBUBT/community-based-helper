import type { Metadata } from "next";
import { listSellers } from "@/services/catalog";
import { SellersView } from "./SellersView";

export const metadata: Metadata = {
  title: "বিক্রেতা",
  description: "অনলাইন দোকান, মার্কেটের দোকান আর ফেসবুক গ্রুপের বিক্রেতাদের তালিকা, কারা যাচাই করা।",
};

export default async function SellersPage() {
  return <SellersView initial={await listSellers()} />;
}
