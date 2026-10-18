import { Notice } from "@/components/ui/Notice";
import type { NearbyPlace, Place } from "@/types/place";
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
  if (!places.length) return <Notice>{empty}</Notice>;
  return (
    <ul>
      {places.map((p) => (
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
  );
}
