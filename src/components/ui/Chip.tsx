import type { ReactNode } from "react";

interface ChipProps {
  selected?: boolean;
  onClick?: () => void;
  children: ReactNode;
}

export function Chip({ selected = false, onClick, children }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`h-9 shrink-0 rounded-full border px-4 text-sm font-semibold transition-colors ${
        selected ? "border-brand bg-brand-soft text-brand-text" : "border-line bg-surface text-ink hover:border-brand"
      }`}
    >
      {children}
    </button>
  );
}
