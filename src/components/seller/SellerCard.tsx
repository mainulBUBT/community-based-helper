"use client";

import { ChevronRight, Globe, MapPin, Users } from "lucide-react";
import Link from "next/link";
import { useI18n } from "@/hooks/useI18n";
import type { Seller } from "@/types/catalog";
import { VerifiedBadge } from "./VerifiedBadge";

const KIND_ICON = { website: Globe, shop: MapPin, group: Users };

export function SellerCard({ seller }: { seller: Seller }) {
  const { t } = useI18n();
  const Icon = KIND_ICON[seller.kind];
  return (
    <Link href={`/seller/${seller.id}/`} className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-2">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
        <Icon size={18} aria-hidden="true" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate font-semibold group-hover:text-brand">{seller.name}</span>
        <span className="truncate text-xs text-dim">{[t.sellerKind[seller.kind], seller.area].filter(Boolean).join(", ")}</span>
      </span>
      <VerifiedBadge verified={seller.verified} />
      <ChevronRight size={18} className="text-faint" aria-hidden="true" />
    </Link>
  );
}
