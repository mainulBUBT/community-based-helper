import type { LucideIcon } from "lucide-react";

interface AreaOptionProps {
  icon: LucideIcon;
  label: string;
  detail?: string;
  accent?: boolean;
  onClick: () => void;
}

export function AreaOption({ icon: Icon, label, detail, accent = false, onClick }: AreaOptionProps) {
  return (
    <button
      type="button"
      data-option
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left transition-colors hover:bg-surface-2 focus-visible:bg-surface-2 focus-visible:-outline-offset-2"
    >
      <span className={`flex size-9 shrink-0 items-center justify-center rounded-full bg-surface-2 ${accent ? "text-me" : "text-dim"}`}>
        <Icon size={18} aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] text-ink">{label}</span>
        {detail && <span className="block truncate text-xs text-dim">{detail}</span>}
      </span>
    </button>
  );
}
