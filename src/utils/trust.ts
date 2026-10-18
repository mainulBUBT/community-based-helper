import { APP } from "@/config/app";
import type { Place } from "@/types/place";
import { toBnDigits } from "./bangla";

export type TrustLevel = "confirmed" | "disputed" | "new" | "unverified" | "stale";

export interface Trust {
  level: TrustLevel;
  label: string;
  detail: string;
}

const DAY_MS = 86_400_000;

export function daysSince(iso: string | null, now = Date.now()): number | null {
  return iso ? Math.max(0, Math.floor((now - Date.parse(iso)) / DAY_MS)) : null;
}

export function trustOf(place: Pick<Place, "status" | "verifiedAt" | "source">): Trust {
  if (place.status === "disputed") {
    return { level: "disputed", label: "দ্বিমত আছে", detail: "দ্বিমত আছে — কেউ কেউ তথ্য ভুল বলেছেন" };
  }
  if (place.status === "new" && place.source === "osm") {
    return { level: "unverified", label: "যাচাই হয়নি", detail: "OpenStreetMap থেকে নেওয়া — এখনো কেউ যাচাই করেনি" };
  }
  if (place.status === "new") return { level: "new", label: "নতুন যোগ", detail: "নতুন যোগ — এখনো যাচাই হয়নি" };
  const days = daysSince(place.verifiedAt);
  if (days === null || days >= APP.staleAfterDays) {
    return { level: "stale", label: "পুরনো তথ্য", detail: `পুরনো তথ্য — শেষ যাচাই ${verifiedAgo(place.verifiedAt)}` };
  }
  return { level: "confirmed", label: "নিশ্চিত", detail: `নিশ্চিত — ${verifiedAgo(place.verifiedAt)} যাচাই করা` };
}

export function verifiedAgo(iso: string | null): string {
  const days = daysSince(iso);
  if (days === null) return "এখনো যাচাই হয়নি";
  if (days === 0) return "আজ";
  if (days === 1) return "গতকাল";
  if (days < 30) return `${toBnDigits(days)} দিন আগে`;
  return `${toBnDigits(Math.round(days / 30))} মাস আগে`;
}
