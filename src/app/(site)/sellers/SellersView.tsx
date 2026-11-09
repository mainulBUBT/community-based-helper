"use client";

import { Search, SearchX } from "lucide-react";
import { useState } from "react";
import { SellerCard } from "@/components/seller/SellerCard";
import { Chip } from "@/components/ui/Chip";
import { EmptyState } from "@/components/ui/EmptyState";
import { useI18n } from "@/hooks/useI18n";
import type { Seller, SellerKind } from "@/types/catalog";

type Filter = "all" | "verified" | SellerKind;
const KINDS: SellerKind[] = ["website", "shop", "group"];

const matches = (filter: Filter, seller: Seller) => filter === "all" || (filter === "verified" ? seller.verified : seller.kind === filter);

function matchesText(seller: Seller, query: string) {
  const haystack = `${seller.name} ${seller.area ?? ""} ${seller.website ?? ""} ${seller.phone ?? ""} ${seller.whatsapp ?? ""}`.toLowerCase();
  const compact = haystack.replace(/[\s-]/g, "");
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => haystack.includes(word) || compact.includes(word));
}

export function SellersView({ sellers: all, counts }: { sellers: Seller[]; counts: Record<string, number> }) {
  const { t, num } = useI18n();
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const sellers = all
    .filter((s) => matches(filter, s) && matchesText(s, query))
    .sort((a, b) => Number(b.verified) - Number(a.verified) || (counts[b.id] ?? 0) - (counts[a.id] ?? 0));

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-1">
        <h1 className="text-xl font-bold md:text-2xl">{t.seller.title}</h1>
        <p className="text-sm text-dim">{t.seller.summary(num(all.length), num(all.filter((s) => s.verified).length))}</p>
      </header>

      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <label className="flex h-11 items-center gap-2 rounded-lg border border-line bg-surface px-3 focus-within:border-brand md:w-80 md:shrink-0">
          <Search size={18} className="shrink-0 text-dim" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.seller.search}
            aria-label={t.seller.search}
            className="h-full min-w-0 flex-1 bg-transparent text-base text-ink outline-none"
          />
        </label>
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0">
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
      </div>

      {sellers.length ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sellers.map((seller) => (
            <div key={seller.id} className="overflow-hidden rounded-lg border border-line bg-surface">
              <SellerCard seller={seller} products={counts[seller.id]} />
            </div>
          ))}
        </div>
      ) : (
        <EmptyState icon={SearchX} title={query.trim() ? t.search.notFound(query.trim()) : t.search.emptyCategory} />
      )}
    </div>
  );
}
