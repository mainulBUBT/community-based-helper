"use client";

import type { LucideIcon } from "lucide-react";
import { useId, useState } from "react";

interface InfoTipProps {
  icon: LucideIcon;
  label: string;
  className?: string;
}

export function InfoTip({ icon: Icon, label, className = "" }: InfoTipProps) {
  const [open, setOpen] = useState(false);
  const tipId = useId();

  return (
    <span className="group relative z-10 inline-flex">
      <button
        type="button"
        aria-label={label}
        aria-describedby={tipId}
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setOpen(false)}
        className={`flex size-6 items-center justify-center rounded-full ring-2 ring-page ${className}`}
      >
        <Icon size={14} strokeWidth={2.4} aria-hidden="true" />
      </button>
      <span
        id={tipId}
        role="tooltip"
        className={`pointer-events-none absolute bottom-full left-0 mb-1.5 w-max max-w-60 rounded-lg bg-ink px-2.5 py-1.5 text-xs font-semibold text-page shadow-lg transition-opacity group-hover:opacity-100 ${
          open ? "opacity-100" : "opacity-0"
        }`}
      >
        {label}
      </span>
    </span>
  );
}
