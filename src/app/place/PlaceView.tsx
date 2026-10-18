"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PlaceDetail } from "@/components/place/PlaceDetail";
import { AsyncContent, Notice } from "@/components/ui/Notice";
import { usePlaces } from "@/hooks/usePlaces";

export function PlaceView() {
  const id = useSearchParams().get("id");
  const { tree, loading, error } = usePlaces();
  const place = id ? tree.byId.get(id) : undefined;

  if (loading || error) return <AsyncContent loading={loading} error={error} />;
  if (!place) {
    return (
      <Notice>
        জায়গাটা পাওয়া যায়নি — হয়তো সরানো হয়েছে।{" "}
        <Link href="/" className="text-brand underline">
          হোমে ফিরুন
        </Link>
      </Notice>
    );
  }

  return <PlaceDetail key={place.id} place={place} tree={tree} />;
}
