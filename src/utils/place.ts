import { getCategory } from "@/config/categories";
import type { LatLng, NearbyPlace, Place } from "@/types/place";
import { distanceKm } from "./geo";
import { hoursLabel } from "./hours";
import { mapUrl } from "./links";
import { shopsUnder, type PlaceTree } from "./place-tree";
import { purposeNames } from "./purposes";

const FLOOR_ORDER = ["নিচতলা", "১ম তলা", "২য় তলা", "৩য় তলা", "৪র্থ তলা"];
const UNKNOWN_FLOOR = "তলা জানা নেই";

const includesQuery = (fields: (string | undefined)[], q: string) =>
  fields.some((field) => field?.toLowerCase().includes(q));

export function byDistance(places: Place[], from: LatLng): NearbyPlace[] {
  return places.map((p) => ({ ...p, distanceKm: distanceKm(from, p) })).sort((a, b) => a.distanceKm - b.distanceKm);
}

export function matchesQuery(place: Place, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const category = getCategory(place.categoryId);
  return includesQuery([place.name, place.area, category?.name, category?.short, ...purposeNames(place)], q);
}

export function searchPlaces(places: Place[], tree: PlaceTree, query: string): Place[] {
  const q = query.trim().toLowerCase();
  const sellsIt = (market: Place) => shopsUnder(tree, market.id).some((shop) => includesQuery(purposeNames(shop), q));
  return places.filter((p) => matchesQuery(p, query) || (p.kind === "market" && sellsIt(p)));
}

export function placeLocation(place: Place): string {
  return [place.floor, place.unit && `দোকান ${place.unit}`, place.area].filter(Boolean).join(" · ");
}

export function whereLabel(place: Place, ancestors: Place[]): string {
  return [...ancestors.map((a) => a.name), placeLocation(place)].filter(Boolean).join(" · ");
}

export function placeSummary(place: Place, ancestors: Place[] = []): string {
  const category = getCategory(place.categoryId);
  return [
    place.name,
    [category?.name, whereLabel(place, ancestors)].filter(Boolean).join(" · "),
    `খোলার সময়: ${hoursLabel(place)}`,
    place.phone && `ফোন: ${place.phone}`,
    `ম্যাপ: ${mapUrl(place)}`,
  ]
    .filter(Boolean)
    .join("\n");
}

function floorRank(floor: string | null): number {
  const rank = floor ? FLOOR_ORDER.indexOf(floor) : -1;
  return rank === -1 ? FLOOR_ORDER.length : rank;
}

export function groupShops(shops: Place[], sectionOf: (shop: Place) => string): [string, Place[]][] {
  const sorted = [...shops].sort(
    (a, b) =>
      sectionOf(a).localeCompare(sectionOf(b), "bn") ||
      floorRank(a.floor) - floorRank(b.floor) ||
      a.name.localeCompare(b.name, "bn"),
  );
  const groups = new Map<string, Place[]>();
  for (const shop of sorted) {
    const label = [sectionOf(shop), shop.floor ?? UNKNOWN_FLOOR].filter(Boolean).join(" · ");
    groups.set(label, [...(groups.get(label) ?? []), shop]);
  }
  return [...groups];
}
