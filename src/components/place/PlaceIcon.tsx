import { CategoryIcon } from "@/components/ui/CategoryIcon";
import type { Place } from "@/types/place";
import { TrustBadge } from "./TrustBadge";

interface PlaceIconProps {
  place: Place;
  isOpen: boolean;
  size?: number;
}

export function PlaceIcon({ place, isOpen, size }: PlaceIconProps) {
  return (
    <span className="relative shrink-0 self-start">
      <CategoryIcon categoryId={place.categoryId} tone={isOpen ? "open" : "closed"} size={size} />
      <span className="absolute -bottom-2 -right-2">
        <TrustBadge place={place} />
      </span>
    </span>
  );
}
