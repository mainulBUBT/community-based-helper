import type { ReactNode } from "react";

export function Tabs<T extends string>({ tabs, active, onChange, label, idPrefix }: { tabs: { id: T; label: ReactNode }[]; active: T; onChange: (id: T) => void; label: string; idPrefix: string }) {
  return (
    <div role="tablist" aria-label={label} className="no-scrollbar -mx-1 flex gap-1 overflow-x-auto border-b border-line px-1">
      {tabs.map(({ id, label: text }) => (
        <button
          key={id}
          type="button"
          role="tab"
          aria-selected={active === id}
          aria-controls={`${idPrefix}-${id}`}
          onClick={() => onChange(id)}
          className={`-mb-px h-11 shrink-0 border-b-2 px-4 text-sm font-semibold whitespace-nowrap transition-colors ${active === id ? "border-brand text-brand" : "border-transparent text-dim hover:text-ink"}`}
        >
          {text}
        </button>
      ))}
    </div>
  );
}
