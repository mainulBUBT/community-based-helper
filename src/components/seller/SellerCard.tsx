"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { useI18n } from "@/hooks/useI18n";
import type { Seller } from "@/types/catalog";
import { SellerLogo } from "./SellerLogo";
import { VerifiedBadge } from "./VerifiedBadge";

export function SellerCard({ seller }: { seller: Seller }) {
  const { t, prefix } = useI18n();
  return (
    <Link href={`${prefix}/seller/${seller.id}/`} className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-2">
      <SellerLogo seller={seller} size={36} />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="flex min-w-0 items-center gap-1.5">
          <span className="truncate font-semibold group-hover:text-brand">{seller.name}</span>
          <VerifiedBadge verified={seller.verified} />
        </span>
        <span className="truncate text-xs text-dim">{[t.sellerKind[seller.kind], seller.area].filter(Boolean).join(", ")}</span>
      </span>
      <ChevronRight size={18} className="text-faint" aria-hidden="true" />
    </Link>
  );
}
