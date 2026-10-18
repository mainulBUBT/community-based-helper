import type { AreaHit } from "@/types/area";

const ENDPOINT = "https://nominatim.openstreetmap.org/search";
const DHAKA_VIEWBOX = "90.33,23.90,90.51,23.66";
const MIN_INTERVAL_MS = 1000;
const MAX_RESULTS = 5;

interface NominatimPlace {
  place_id: number;
  lat: string;
  lon: string;
  name: string;
  display_name: string;
}

const cache = new Map<string, AreaHit[]>();
let nextSlot = 0;

async function waitForSlot() {
  const at = Math.max(Date.now(), nextSlot);
  nextSlot = at + MIN_INTERVAL_MS;
  await new Promise((resolve) => setTimeout(resolve, at - Date.now()));
}

const toHit = (place: NominatimPlace): AreaHit => ({
  key: `osm:${place.place_id}`,
  label: place.name || place.display_name.split(",")[0],
  detail: place.display_name,
  lat: Number(place.lat),
  lng: Number(place.lon),
});

export async function searchNominatim(query: string): Promise<AreaHit[]> {
  const key = query.toLowerCase();
  const cached = cache.get(key);
  if (cached) return cached;

  await waitForSlot();
  const params = new URLSearchParams({
    q: query,
    format: "jsonv2",
    countrycodes: "bd",
    viewbox: DHAKA_VIEWBOX,
    limit: String(MAX_RESULTS),
    "accept-language": "bn,en",
  });
  const response = await fetch(`${ENDPOINT}?${params}`, { referrerPolicy: "strict-origin-when-cross-origin" });
  if (!response.ok) throw new Error(`Nominatim ${response.status}`);

  const hits = ((await response.json()) as NominatimPlace[]).map(toHit);
  cache.set(key, hits);
  return hits;
}
