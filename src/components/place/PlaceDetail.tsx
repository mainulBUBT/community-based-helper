"use client";

import { Bookmark, BookmarkCheck, Copy, Navigation, Phone, Share2 } from "lucide-react";
import { SplitView } from "@/components/layout/SplitView";
import { MarketDirectory } from "@/components/market/MarketDirectory";
import { PlaceMap } from "@/components/map/PlaceMap";
import { ActionButton } from "@/components/ui/ActionButton";
import { BackLink } from "@/components/ui/BackLink";
import { getCategory } from "@/config/categories";
import { useClock } from "@/hooks/useClock";
import { useSaved } from "@/hooks/useSaved";
import { useUserLocation } from "@/hooks/useUserLocation";
import { copyText, shareText } from "@/lib/clipboard";
import type { Place } from "@/types/place";
import { distanceKm, formatDistance } from "@/utils/geo";
import { hoursLabel, openState } from "@/utils/hours";
import { categoryPath, directionsUrl, placePath, telHref } from "@/utils/links";
import { placeSummary, whereLabel } from "@/utils/place";
import { ancestorsOf, type PlaceTree } from "@/utils/place-tree";
import { purposeNames } from "@/utils/purposes";
import { verifiedAgo } from "@/utils/trust";
import { FactList, type Fact } from "./FactList";
import { PlaceIcon } from "./PlaceIcon";

export function PlaceDetail({ place, tree }: { place: Place; tree: PlaceTree }) {
  const clock = useClock();
  const { location } = useUserLocation();
  const { isSaved, toggle } = useSaved();
  const category = getCategory(place.categoryId);
  const ancestors = ancestorsOf(tree, place);
  const parent = ancestors.at(-1);
  const open = openState(place, clock);
  const saved = isSaved(place.id);
  const isMarket = place.kind === "market";
  const summary = placeSummary(place, ancestors);

  const facts: Fact[] = [
    { label: "খোলার সময়", value: hoursLabel(place) },
    ...(place.phone ? [{ label: "ফোন", value: place.phone, href: telHref(place.phone), copy: true }] : []),
    { label: "কোথায়", value: whereLabel(place, ancestors) || "—", copy: true },
    ...(!isMarket && place.purposes.length ? [{ label: "কিসের জন্য", value: purposeNames(place).join(", ") }] : []),
    { label: "দূরত্ব", value: `${formatDistance(distanceKm(location, place))} · ${location.label} থেকে` },
    { label: "শেষ যাচাই", value: verifiedAgo(place.verifiedAt) },
  ];

  return (
    <SplitView
      header={
        <header className="flex flex-col gap-4 px-4 pb-4 pt-3">
          {parent ? (
            <BackLink href={placePath(parent.id)} label={parent.name} />
          ) : (
            <BackLink href={categoryPath(place.categoryId)} label={category?.name ?? "ফিরে যান"} />
          )}
          <div className="flex items-start gap-3">
            <PlaceIcon place={place} isOpen={open.isOpen} size={48} />
            <div className="flex min-w-0 flex-col gap-1">
              <p className="text-sm text-dim">{[category?.name, ...ancestors.map((a) => a.name)].filter(Boolean).join(" › ")}</p>
              <h1 className="font-display text-[26px] leading-tight">{place.name}</h1>
              {place.description && <p className="text-[15px] text-ink-2">{place.description}</p>}
              <p className={`text-[15px] ${open.isOpen ? "text-brand" : "text-dim"}`}>{open.label}</p>
            </div>
          </div>
          <div className="flex gap-2">
            {place.phone && <ActionButton icon={Phone} label="কল করুন" href={telHref(place.phone)} variant="primary" />}
            <ActionButton icon={Navigation} label="দিক দেখুন" href={directionsUrl(place)} external />
          </div>
          <div className="flex gap-2">
            <ActionButton
              icon={saved ? BookmarkCheck : Bookmark}
              label={saved ? "সেভ করা" : "সেভ"}
              pressed={saved}
              onClick={() => toggle(place.id)}
              size="sm"
            />
            <ActionButton icon={Copy} label="তথ্য কপি" onClick={() => copyText(summary, "পুরো তথ্য কপি হয়েছে")} size="sm" />
            <ActionButton icon={Share2} label="শেয়ার" onClick={() => shareText(place.name, summary)} size="sm" />
          </div>
        </header>
      }
      map={<PlaceMap places={[place]} me={location} selectedId={place.id} />}
    >
      <div className="flex flex-col gap-2 px-4 pb-6 pt-2">
        <FactList facts={facts} />
      </div>
      {isMarket && <MarketDirectory market={place} tree={tree} clock={clock} />}
    </SplitView>
  );
}
