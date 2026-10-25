"use client";

import { useState } from "react";
import { SellerCard } from "@/components/seller/SellerCard";
import { Chip } from "@/components/ui/Chip";
import { useI18n } from "@/hooks/useI18n";
import type { Seller, SellerKind } from "@/types/catalog";

type Filter = "all" | "verified" | SellerKind;
const KINDS: SellerKind[] = ["website", "shop", "group"];

const matches = (filter: Filter, seller: Seller) => filter === "all" || (filter === "verified" ? seller.verified : seller.kind === filter);

export function SellersView({ initial }: { initial: Seller[] }) {
  const { t } = useI18n();
  const [filter, setFilter] = useState<Filter>("all");
  const sellers = initial.filter((s) => matches(filter, s)).sort((a, b) => Number(b.verified) - Number(a.verified));

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold md:text-2xl">{t.seller.title}</h1>
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
        <Chip selected={filter === "all"} onClick={() => setFilter("all")}>
          {t.search.all}
        </Chip>
        <Chip selected={filter === "verified"} onClick={() => setFilter("verified")}>
          {t.seller.filterVerified}
        </Chip>
        {KINDS.map((kind) => (
          <Chip key={kind} selected={filter === kind} onClick={() => setFilter(kind)}>
            {t.sellerKind[kind]}
          </Chip>
        ))}
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {sellers.map((seller) => (
          <div key={seller.id} className="overflow-hidden rounded-md bg-surface shadow-sm ring-1 ring-line-soft">
            <SellerCard seller={seller} />
          </div>
        ))}
      </div>
    </div>
  );
}
