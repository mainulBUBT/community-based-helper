"use client";

import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { CategoryChips } from "@/components/category/CategoryChips";
import { SplitView } from "@/components/layout/SplitView";
import { PlaceMap } from "@/components/map/PlaceMap";
import { PlaceList } from "@/components/place/PlaceList";
import { BackLink } from "@/components/ui/BackLink";
import { FilterChips } from "@/components/ui/FilterChips";
import { AsyncContent } from "@/components/ui/Notice";
import { CATEGORIES, getCategory } from "@/config/categories";
import { purposeRank } from "@/config/purposes";
import { useClock } from "@/hooks/useClock";
import { usePlaces } from "@/hooks/usePlaces";
import { useUserLocation } from "@/hooks/useUserLocation";
import { toBnDigits } from "@/utils/bangla";
import { openState } from "@/utils/hours";
import { byDistance } from "@/utils/place";
import { shopsUnder } from "@/utils/place-tree";
import { describePurpose, purposeStats } from "@/utils/purposes";

export function CategoryView() {
  const category = getCategory(useSearchParams().get("c")) ?? CATEGORIES[0];
  const { places, tree, loading, error } = usePlaces();
  const { location } = useUserLocation();
  const clock = useClock();
  const [purpose, setPurpose] = useState<string | null>(null);

  const rows = useMemo(
    () =>
      byDistance(places.filter((p) => p.categoryId === category.id && !p.parentId), location).map((place) => ({
        place,
        stats: purposeStats(place, shopsUnder(tree, place.id)),
      })),
    [places, tree, category.id, location],
  );

  const purposeOptions = [...new Map(rows.flatMap((r) => r.stats).map((s) => [s.id, s.name]))]
    .sort(([a], [b]) => purposeRank(a) - purposeRank(b))
    .map(([value, label]) => ({ value, label }));
  const activePurpose = purposeOptions.some((o) => o.value === purpose) ? purpose : null;

  const shown = rows
    .filter((r) => !activePurpose || r.stats.some((s) => s.id === activePurpose))
    .map((r) => ({ ...r, isOpen: openState(r.place, clock).isOpen }))
    .sort((a, b) => Number(b.isOpen) - Number(a.isOpen));
  const list = shown.map((r) => r.place);
  const notes = new Map(
    shown.map((r) => {
      const stat = r.stats.find((s) => s.id === activePurpose);
      return [r.place.id, stat && describePurpose(stat)];
    }),
  );

  return (
    <SplitView
      header={
        <header className="flex flex-col gap-3 pb-3 pt-3">
          <div className="flex flex-col gap-1 px-4">
            <BackLink href="/" label="হোম" />
            <h1 className="font-display text-[26px] leading-tight">{category.name}</h1>
            {!loading && (
              <p className="text-sm text-dim">
                {toBnDigits(list.length)}টি জায়গা · {toBnDigits(shown.filter((r) => r.isOpen).length)}টি এখন খোলা · কাছের আগে
              </p>
            )}
          </div>
          <CategoryChips activeId={category.id} />
          {purposeOptions.length > 0 && (
            <FilterChips label="কিসের জন্য" options={purposeOptions} value={activePurpose} onChange={setPurpose} />
          )}
        </header>
      }
      map={<PlaceMap places={list} me={location} />}
    >
      <AsyncContent loading={loading} error={error}>
        <PlaceList
          places={list}
          clock={clock}
          empty="এই বিভাগে এখনো কিছু যোগ হয়নি।"
          noteOf={(p) => notes.get(p.id) ?? undefined}
        />
      </AsyncContent>
    </SplitView>
  );
}
