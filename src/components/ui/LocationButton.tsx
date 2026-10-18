"use client";

import { LocateFixed } from "lucide-react";
import dynamic from "next/dynamic";
import { useRef, useState } from "react";
import { useUserLocation } from "@/hooks/useUserLocation";

const AreaPicker = dynamic(() => import("@/components/location/AreaPicker").then((m) => m.AreaPicker), { ssr: false });

const VARIANTS = {
  chip: "h-9 gap-1.5 rounded-full border border-line px-3 text-sm text-ink-2 hover:text-ink",
  rail: "size-14 flex-col justify-center gap-1 rounded-xl text-xs font-medium text-dim hover:text-ink",
};

export function LocationButton({ variant = "chip" }: { variant?: keyof typeof VARIANTS }) {
  const { location } = useUserLocation();
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const close = () => {
    setOpen(false);
    buttonRef.current?.focus();
  };

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-label={`অবস্থান বদলান — এখন ${location.label}`}
        title="অবস্থান বদলান"
        className={`flex min-w-0 shrink-0 items-center transition-colors ${VARIANTS[variant]}`}
      >
        <LocateFixed size={variant === "rail" ? 22 : 16} aria-hidden="true" className={location.isDefault ? "" : "text-me"} />
        <span className="truncate">{variant === "rail" ? "অবস্থান" : location.label}</span>
      </button>
      {open && <AreaPicker onClose={close} />}
    </>
  );
}
