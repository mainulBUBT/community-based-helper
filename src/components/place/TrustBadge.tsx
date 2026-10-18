import { BadgeCheck, CircleDashed, History, Sparkles, TriangleAlert, type LucideIcon } from "lucide-react";
import { InfoTip } from "@/components/ui/InfoTip";
import type { Place } from "@/types/place";
import { trustOf, type TrustLevel } from "@/utils/trust";

const BADGES: Record<TrustLevel, { icon: LucideIcon; tone: string }> = {
  confirmed: { icon: BadgeCheck, tone: "bg-brand text-page" },
  disputed: { icon: TriangleAlert, tone: "bg-warn text-page" },
  new: { icon: Sparkles, tone: "bg-me text-page" },
  unverified: { icon: CircleDashed, tone: "bg-dim text-page" },
  stale: { icon: History, tone: "bg-faint text-page" },
};

export function TrustBadge({ place }: { place: Pick<Place, "status" | "verifiedAt" | "source"> }) {
  const trust = trustOf(place);
  const { icon, tone } = BADGES[trust.level];
  return <InfoTip icon={icon} label={trust.detail} className={tone} />;
}
