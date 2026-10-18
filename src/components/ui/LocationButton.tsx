"use client";

import { LocateFixed } from "lucide-react";
import { useUserLocation } from "@/hooks/useUserLocation";

const VARIANTS = {
  chip: "h-9 gap-1.5 rounded-full border border-line px-3 text-sm text-ink-2 hover:text-ink",
  rail: "size-14 flex-col justify-center gap-1 rounded-xl text-xs font-medium text-dim hover:text-ink",
};

export function LocationButton({ variant = "chip" }: { variant?: keyof typeof VARIANTS }) {
  const { location, showMyLocation } = useUserLocation();
  return (
    <button
      type="button"
      onClick={showMyLocation}
      title="ম্যাপে আমার অবস্থান দেখান"
      className={`flex min-w-0 shrink-0 items-center transition-colors ${VARIANTS[variant]}`}
    >
      <LocateFixed size={variant === "rail" ? 22 : 16} aria-hidden="true" className={location.isDefault ? "" : "text-me"} />
      <span className="truncate">{variant === "rail" ? "অবস্থান" : location.label}</span>
    </button>
  );
}
