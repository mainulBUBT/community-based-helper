import type { Place } from "@/types/place";
import { trustOf, type TrustLevel } from "@/utils/trust";

const STYLES: Record<TrustLevel, string> = {
  confirmed: "bg-brand/12 text-brand",
  disputed: "bg-warn/14 text-warn",
  new: "bg-me/14 text-me",
  stale: "bg-surface-2 text-dim",
};

export function TrustBadge({ place }: { place: Pick<Place, "status" | "verifiedAt"> }) {
  const trust = trustOf(place);
  return (
    <span className={`inline-flex items-center rounded-md px-2 text-xs font-semibold leading-6 ${STYLES[trust.level]}`}>
      {trust.label}
    </span>
  );
}
