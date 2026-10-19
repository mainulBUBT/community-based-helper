import { distanceKm, nearestArea } from "./geo.mjs";

const SAME_AREA_KM = 1;

export function areaList(elements) {
  const areas = elements
    .filter((e) => e.tags?.place && e.lat != null)
    .map((e) => ({
      name: (e.tags["name:bn"] ?? e.tags.name).trim(),
      en: e.tags["name:en"]?.trim() ?? null,
      kind: e.tags.place,
      lat: e.lat,
      lng: e.lon,
    }));
  const unique = areas.filter(
    (area, i) => !areas.slice(0, i).some((other) => other.name === area.name && distanceKm(area, other) < SAME_AREA_KM),
  );
  const suburbs = unique.filter((area) => area.kind === "suburb");
  return unique.map((area) => ({
    name: area.name,
    en: area.en,
    kind: area.kind,
    near: area.kind === "suburb" ? null : nearestArea(area, suburbs),
    lat: Number(area.lat.toFixed(5)),
    lng: Number(area.lng.toFixed(5)),
  }));
}

export const areasJson = (areas) => `[\n${areas.map((area) => JSON.stringify(area)).join(",\n")}\n]\n`;
