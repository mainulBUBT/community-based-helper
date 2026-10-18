"use client";

import { useMemo, useState } from "react";
import areas from "@/data/areas.json";
import { searchNominatim } from "@/services/geocode";
import type { AreaHit } from "@/types/area";
import { indexAreas, searchAreas } from "@/utils/area-search";

const AREA_INDEX = indexAreas(areas);

export interface OnlineSearch {
  query: string;
  status: "loading" | "done" | "error";
  hits: AreaHit[];
}

export function useAreaSearch(query: string) {
  const term = query.trim();
  const local = useMemo(() => searchAreas(AREA_INDEX, term), [term]);
  const [search, setSearch] = useState<OnlineSearch | null>(null);
  const online = search?.query === term ? search : null;

  async function searchOnline() {
    if (!term || local.length || (online && online.status !== "error")) return;
    const settle = (next: OnlineSearch) => setSearch((current) => (current?.query === term ? next : current));
    setSearch({ query: term, status: "loading", hits: [] });
    try {
      settle({ query: term, status: "done", hits: await searchNominatim(term) });
    } catch {
      settle({ query: term, status: "error", hits: [] });
    }
  }

  return { term, local, online, hits: local.length ? local : (online?.hits ?? []), searchOnline };
}
