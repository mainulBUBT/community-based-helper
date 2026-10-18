import { Phone } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import type { Place } from "@/types/place";
import { formatDistance } from "@/utils/geo";
import { openState, type Clock } from "@/utils/hours";
import { placePath, telHref } from "@/utils/links";
import { placeLocation } from "@/utils/place";
import { TrustBadge } from "./TrustBadge";

interface PlaceRowProps {
  place: Place;
  clock: Clock;
  distanceKm?: number;
  parentName?: string;
  note?: string;
  action?: ReactNode;
}

export function PlaceRow({ place, clock, distanceKm, parentName, note, action }: PlaceRowProps) {
  const open = openState(place, clock);
  const meta = [parentName, placeLocation(place), distanceKm != null && formatDistance(distanceKm)]
    .filter(Boolean)
    .join(" · ");

  return (
    <li className="flex items-center gap-3 border-b border-line-soft px-4 py-3">
      <Link
        href={placePath(place.id)}
        transitionTypes={["nav-forward"]}
        className="flex min-w-0 flex-1 items-start gap-3 rounded-lg transition-opacity active:opacity-70"
      >
        <CategoryIcon categoryId={place.categoryId} tone={open.isOpen ? "open" : "closed"} />
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="font-semibold leading-snug">{place.name}</span>
          {meta && <span className="text-sm text-ink-2">{meta}</span>}
          {note && <span className="text-sm font-medium text-brand">{note}</span>}
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
            <span className={open.isOpen ? "text-brand" : "text-dim"}>{open.label}</span>
            <TrustBadge place={place} />
          </span>
        </span>
      </Link>
      {action ??
        (place.phone && (
          <a
            href={telHref(place.phone)}
            aria-label={`${place.name} — কল করুন`}
            className="flex size-11 shrink-0 items-center justify-center rounded-full border border-line text-brand transition-colors hover:bg-surface-2 active:scale-95"
          >
            <Phone size={18} aria-hidden="true" />
          </a>
        ))}
    </li>
  );
}
