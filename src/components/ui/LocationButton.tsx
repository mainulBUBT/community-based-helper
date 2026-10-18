"use client";

import { LocateFixed } from "lucide-react";
import { useUserLocation } from "@/hooks/useUserLocation";

export function LocationButton() {
  const { location, locate } = useUserLocation();
  return (
    <button
      type="button"
      onClick={locate}
      title="আমার আসল অবস্থান ব্যবহার করুন"
      className="flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-line px-3 text-sm text-ink-2 hover:text-ink"
    >
      <LocateFixed size={16} aria-hidden="true" className={location.isDefault ? "text-dim" : "text-me"} />
      {location.label}
    </button>
  );
}
