"use client";

import { useMemo, useState } from "react";
import { CategoryGrid } from "@/components/category/CategoryGrid";
import { SplitView } from "@/components/layout/SplitView";
import { PlaceMap } from "@/components/map/PlaceMap";
import { PlaceList } from "@/components/place/PlaceList";
import { LocationButton } from "@/components/ui/LocationButton";
import { AsyncContent } from "@/components/ui/Notice";
import { SearchBox } from "@/components/ui/SearchBox";
import { Section } from "@/components/ui/Section";
import { APP } from "@/config/app";
import { useClock } from "@/hooks/useClock";
import { usePlaces } from "@/hooks/usePlaces";
import { useUserLocation } from "@/hooks/useUserLocation";
import { toBnDigits } from "@/utils/bangla";
import { openState } from "@/utils/hours";
import { byDistance, searchPlaces } from "@/utils/place";

const OPEN_NEARBY_LIMIT = 5;

export function HomeView() {
  const { places, tree, loading, error } = usePlaces();
  const { location } = useUserLocation();
  const clock = useClock();
  const [query, setQuery] = useState("");

  const sorted = useMemo(() => byDistance(places.filter((p) => !p.parentId), location), [places, location]);
  const nearby = useMemo(() => sorted.filter((p) => p.distanceKm <= APP.nearbyRadiusKm), [sorted]);
  const results = useMemo(
    () => (query.trim() ? byDistance(searchPlaces(places, tree, query), location) : null),
    [places, tree, query, location],
  );
  const openNearby = sorted.filter((p) => openState(p, clock).isOpen).slice(0, OPEN_NEARBY_LIMIT);

  return (
    <SplitView
      header={
        <header className="flex flex-col gap-3 px-4 pb-3 pt-3 lg:pt-5">
          <h1 className="sr-only">{`${APP.name} — ${APP.tagline}`}</h1>
          <div className="hidden items-center justify-between gap-3 lg:flex">
            <span className="font-display text-[28px] leading-none">{APP.name}</span>
            <LocationButton />
          </div>
          <SearchBox value={query} onChange={setQuery} placeholder="ফার্মেসি, জুতা, সবজি, এলাকা…" />
        </header>
      }
      map={<PlaceMap places={results ?? nearby} me={location} />}
    >
      {results ? (
        <Section title={`খোঁজের ফল (${toBnDigits(results.length)})`}>
          <AsyncContent loading={loading} error={error}>
            <PlaceList places={results} clock={clock} tree={tree} empty="কিছু পাওয়া যায়নি। অন্য শব্দে খুঁজে দেখুন।" />
          </AsyncContent>
        </Section>
      ) : (
        <>
          <Section title="বিভাগ">
            <CategoryGrid />
          </Section>
          <Section title="কাছে এখন খোলা">
            <AsyncContent loading={loading} error={error}>
              <PlaceList places={openNearby} clock={clock} empty="কাছে এখন খোলা কিছু পাওয়া যায়নি।" />
            </AsyncContent>
          </Section>
        </>
      )}
    </SplitView>
  );
}
