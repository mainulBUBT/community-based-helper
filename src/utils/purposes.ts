import { getPurpose, purposeRank } from "@/config/purposes";
import type { Place } from "@/types/place";
import { toBnDigits } from "./bangla";

export interface PurposeStat {
  id: string;
  name: string;
  shopCount: number;
  confirmed: number;
}

export const purposeName = (id: string) => getPurpose(id)?.name ?? id;

export function purposeNames(place: Place): string[] {
  return place.purposes.map((p) => purposeName(p.id));
}

export function purposeStats(place: Place, shops: Place[]): PurposeStat[] {
  const stats = new Map<string, PurposeStat>();
  const statFor = (id: string) => {
    const stat = stats.get(id) ?? { id, name: purposeName(id), shopCount: 0, confirmed: 0 };
    stats.set(id, stat);
    return stat;
  };

  for (const purpose of place.purposes) statFor(purpose.id).confirmed = purpose.confirmed;
  for (const shop of shops) for (const purpose of shop.purposes) statFor(purpose.id).shopCount += 1;

  return [...stats.values()].sort((a, b) => b.shopCount - a.shopCount || purposeRank(a.id) - purposeRank(b.id));
}

export function describePurpose(stat: PurposeStat): string {
  return [
    stat.name,
    stat.shopCount > 0 && `${toBnDigits(stat.shopCount)}টা দোকান`,
    stat.confirmed > 0 && `${toBnDigits(stat.confirmed)} জন নিশ্চিত`,
  ]
    .filter(Boolean)
    .join(" · ");
}
