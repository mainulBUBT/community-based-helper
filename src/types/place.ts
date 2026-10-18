export type PlaceStatus = "new" | "confirmed" | "disputed";

export type PlaceKind = "place" | "market" | "shop";

export type PlaceSource = "community" | "osm" | "overture";

export interface LatLng {
  lat: number;
  lng: number;
}

export interface HoursSlot {
  weekday: number;
  opens: number;
  closes: number;
}

export interface PlacePurpose {
  id: string;
  confirmed: number;
}

export interface Place extends LatLng {
  id: string;
  name: string;
  description: string;
  kind: PlaceKind;
  categoryId: string;
  parentId: string | null;
  area: string;
  floor: string | null;
  unit: string | null;
  phone: string | null;
  open24h: boolean;
  hours: HoursSlot[];
  purposes: PlacePurpose[];
  status: PlaceStatus;
  verifiedAt: string | null;
  source: PlaceSource;
  sourceRef: string | null;
}

export type NearbyPlace = Place & { distanceKm: number };
