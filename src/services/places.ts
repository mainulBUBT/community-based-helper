import { supabase } from "@/lib/supabase";
import type { Place, PlaceKind, PlaceSource, PlaceStatus } from "@/types/place";

const PAGE_SIZE = 1000;

const COLUMNS =
  "id, name, description, kind, category_id, parent_id, area, floor, unit, lat, lng, phone, open_24h, status, " +
  "verified_at, source, source_ref, opening_hours(weekday, opens_min, closes_min), place_purposes(purpose_id)";

interface PlaceRow {
  id: string;
  name: string;
  description: string | null;
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
  source: PlaceSource;
  source_ref: string | null;
  opening_hours: { weekday: number; opens_min: number; closes_min: number }[];
  place_purposes: { purpose_id: string }[];
}

interface ConfirmationRow {
  place_id: string;
  purpose_id: string;
  confirmed: number;
}

function fromRow(row: PlaceRow, confirmations: Map<string, number>): Place {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? "",
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
    source: row.source,
    sourceRef: row.source_ref,
  };
}

export async function fetchPlaces(): Promise<Place[]> {
  if (!supabase) throw new Error("Supabase কনফিগার করা নেই — .env.local দেখুন");
  const db = supabase;

  const { count, error } = await db.from("places").select("id", { count: "exact", head: true });
  if (error) throw error;

  const pages = Array.from({ length: Math.ceil((count ?? 0) / PAGE_SIZE) }, (_, i) =>
    db
      .from("places")
      .select(COLUMNS)
      .order("id")
      .range(i * PAGE_SIZE, (i + 1) * PAGE_SIZE - 1)
      .returns<PlaceRow[]>(),
  );
  const [votes, ...results] = await Promise.all([db.rpc("purpose_confirmations"), ...pages]);
  if (votes.error) throw votes.error;

  const confirmations = new Map(
    ((votes.data ?? []) as ConfirmationRow[]).map((v) => [`${v.place_id}:${v.purpose_id}`, Number(v.confirmed)]),
  );
  return results.flatMap((page) => {
    if (page.error) throw page.error;
    return page.data.map((row) => fromRow(row, confirmations));
  });
}
