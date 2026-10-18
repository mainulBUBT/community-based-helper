import samplePlaces from "@/data/sample-places.json";
import { supabase } from "@/lib/supabase";
import type { Place, PlaceKind, PlaceStatus } from "@/types/place";

const COLUMNS =
  "id, name, kind, category_id, parent_id, area, floor, unit, lat, lng, phone, open_24h, status, verified_at, " +
  "opening_hours(weekday, opens_min, closes_min), place_purposes(purpose_id)";

interface PlaceRow {
  id: string;
  name: string;
  kind: PlaceKind;
  category_id: string;
  parent_id: string | null;
  area: string | null;
  floor: string | null;
  unit: string | null;
  lat: number;
  lng: number;
  phone: string | null;
  open_24h: boolean;
  status: PlaceStatus;
  verified_at: string | null;
  opening_hours: { weekday: number; opens_min: number; closes_min: number }[];
  place_purposes: { purpose_id: string }[];
}

interface ConfirmationRow {
  place_id: string;
  purpose_id: string;
  confirmed: number;
}

interface SamplePlace {
  id: string;
  name: string;
  kind: PlaceKind;
  category: string;
  parent?: string;
  area: string | null;
  floor?: string;
  unit?: string;
  lat: number;
  lng: number;
  phone: string | null;
  open24h: boolean;
  hours: number[][];
  closedOn?: number[];
  purposes: string[];
  status?: PlaceStatus;
  verifiedDaysAgo: number | null;
}

const DAY_MS = 86_400_000;
const WEEK = [0, 1, 2, 3, 4, 5, 6];

function fromRow(row: PlaceRow, confirmations: Map<string, number>): Place {
  return {
    id: row.id,
    name: row.name,
    kind: row.kind,
    categoryId: row.category_id,
    parentId: row.parent_id,
    area: row.area ?? "",
    floor: row.floor,
    unit: row.unit,
    lat: row.lat,
    lng: row.lng,
    phone: row.phone,
    open24h: row.open_24h,
    hours: row.opening_hours.map((h) => ({ weekday: h.weekday, opens: h.opens_min, closes: h.closes_min })),
    purposes: row.place_purposes.map(({ purpose_id }) => ({
      id: purpose_id,
      confirmed: confirmations.get(`${row.id}:${purpose_id}`) ?? 0,
    })),
    status: row.status,
    verifiedAt: row.verified_at,
  };
}

function fromSample(item: SamplePlace): Place {
  return {
    id: item.id,
    name: item.name,
    kind: item.kind,
    categoryId: item.category,
    parentId: item.parent ?? null,
    area: item.area ?? "",
    floor: item.floor ?? null,
    unit: item.unit ?? null,
    lat: item.lat,
    lng: item.lng,
    phone: item.phone,
    open24h: item.open24h,
    hours: WEEK.filter((day) => !item.closedOn?.includes(day)).flatMap((weekday) =>
      item.hours.map(([opens, closes]) => ({ weekday, opens, closes })),
    ),
    purposes: item.purposes.map((id) => ({ id, confirmed: 0 })),
    status: item.status ?? "confirmed",
    verifiedAt: item.verifiedDaysAgo == null ? null : new Date(Date.now() - item.verifiedDaysAgo * DAY_MS).toISOString(),
  };
}

export async function fetchPlaces(): Promise<Place[]> {
  if (!supabase) return (samplePlaces as SamplePlace[]).map(fromSample);

  const [places, votes] = await Promise.all([
    supabase.from("places").select(COLUMNS).returns<PlaceRow[]>(),
    supabase.rpc("purpose_confirmations"),
  ]);
  if (places.error) throw places.error;
  if (votes.error) throw votes.error;

  const rows = (votes.data ?? []) as ConfirmationRow[];
  const confirmations = new Map(rows.map((v) => [`${v.place_id}:${v.purpose_id}`, Number(v.confirmed)]));
  return places.data.map((row) => fromRow(row, confirmations));
}
