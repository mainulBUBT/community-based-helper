"use client";

import { useState } from "react";
import { paginate } from "@/components/ui/Pagination";

// অ্যাডমিনের তালিকায় খোঁজ আর পাতা: খোঁজ বদলালে প্রথম পাতায় ফেরে
export function useListSearch<T>(items: T[], text: (item: T) => (string | null | undefined)[], size = 20) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const filtered = words.length
    ? items.filter((item) => {
        const haystack = text(item).filter(Boolean).join(" ").toLowerCase();
        return words.every((word) => haystack.includes(word));
      })
    : items;
  return {
    query,
    search: (value: string) => {
      setQuery(value);
      setPage(1);
    },
    setPage,
    noMatch: words.length > 0 && filtered.length === 0,
    ...paginate(filtered, page, size),
  };
}
