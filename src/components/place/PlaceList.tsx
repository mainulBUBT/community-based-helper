"use client";

import { useState } from "react";
import { Notice } from "@/components/ui/Notice";
import { APP } from "@/config/app";
import type { NearbyPlace, Place } from "@/types/place";
import { toBnDigits } from "@/utils/bangla";
import type { Clock } from "@/utils/hours";
import type { PlaceTree } from "@/utils/place-tree";
import { PlaceRow } from "./PlaceRow";

interface PlaceListProps {
  places: (Place | NearbyPlace)[];
  clock: Clock;
  empty: string;
  tree?: PlaceTree;
  noteOf?: (place: Place) => string | undefined;
}

export function PlaceList({ places, clock, empty, tree, noteOf }: PlaceListProps) {
  const [shown, setShown] = useState<number>(APP.listPageSize);
  if (!places.length) return <Notice>{empty}</Notice>;
  const remaining = places.length - shown;

  return (
    <>
      <ul>
        {places.slice(0, shown).map((p) => (
          <PlaceRow
            key={p.id}
            place={p}
            clock={clock}
            distanceKm={"distanceKm" in p ? p.distanceKm : undefined}
            parentName={p.parentId ? tree?.byId.get(p.parentId)?.name : undefined}
            note={noteOf?.(p)}
          />
        ))}
      </ul>
      {remaining > 0 && (
        <div className="px-4 py-3">
          <button
            type="button"
            onClick={() => setShown((n) => n + APP.listPageSize)}
            className="h-11 w-full rounded-xl border border-line text-sm font-semibold text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink"
          >
            আরও দেখুন — {toBnDigits(remaining)}টি বাকি
          </button>
        </div>
      )}
    </>
  );
}
