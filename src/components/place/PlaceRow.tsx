import { Phone } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import type { Place } from "@/types/place";
import { formatDistance } from "@/utils/geo";
import { openState, type Clock } from "@/utils/hours";
import { placePath, telHref } from "@/utils/links";
import { placeLocation } from "@/utils/place";
import { PlaceIcon } from "./PlaceIcon";

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
    <li className="relative flex items-center gap-3 border-b border-line-soft px-4 py-3 transition-colors hover:bg-surface/60">
      <PlaceIcon place={place} isOpen={open.isOpen} />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <Link
          href={placePath(place.id)}
          transitionTypes={["nav-forward"]}
          className="font-semibold leading-snug after:absolute after:inset-0"
        >
          {place.name}
        </Link>
        {place.description && <p className="line-clamp-1 text-sm text-ink-2">{place.description}</p>}
        {meta && <p className="text-sm text-dim">{meta}</p>}
        {note && <p className="text-sm font-medium text-brand">{note}</p>}
        <p className={`text-sm ${open.isOpen ? "text-brand" : "text-dim"}`}>{open.label}</p>
      </div>
      {action ? (
        <span className="relative z-10">{action}</span>
      ) : (
        place.phone && (
          <a
            href={telHref(place.phone)}
            aria-label={`${place.name} — কল করুন`}
            className="relative z-10 flex size-11 shrink-0 items-center justify-center rounded-full border border-line text-brand transition-colors hover:bg-surface-2 active:scale-95"
          >
            <Phone size={18} aria-hidden="true" />
          </a>
        )
      )}
    </li>
  );
}
