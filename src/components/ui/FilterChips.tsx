export interface ChipOption {
  value: string;
  label: string;
}

interface FilterChipsProps {
  label: string;
  options: ChipOption[];
  value: string | null;
  onChange: (value: string | null) => void;
}

export function FilterChips({ label, options, value, onChange }: FilterChipsProps) {
  const chips = [{ value: null, label: "সব" }, ...options];
  return (
    <div role="group" aria-label={label} className="no-scrollbar flex gap-2 overflow-x-auto px-4">
      {chips.map((chip) => {
        const active = chip.value === value;
        return (
          <button
            key={chip.value ?? "all"}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(chip.value)}
            className={`h-9 shrink-0 rounded-full border px-3 text-sm font-medium transition-colors ${
              active ? "border-brand bg-brand/12 text-brand" : "border-line text-ink-2 hover:text-ink"
            }`}
          >
            {chip.label}
          </button>
        );
      })}
    </div>
  );
}
