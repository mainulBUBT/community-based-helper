import { Search } from "lucide-react";
import type { ComponentProps } from "react";

interface SearchBoxProps extends Omit<ComponentProps<"input">, "value" | "onChange"> {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  label?: string;
}

export function SearchBox({ value, onChange, placeholder, label = "খুঁজুন", ...inputProps }: SearchBoxProps) {
  return (
    <label className="flex h-12 items-center gap-2 rounded-xl border border-line bg-surface px-3 focus-within:border-brand">
      <Search size={18} className="shrink-0 text-dim" aria-hidden="true" />
      <span className="sr-only">{label}</span>
      <input
        type="search"
        {...inputProps}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-full min-w-0 flex-1 bg-transparent text-[15px] text-ink outline-none placeholder:text-faint"
      />
    </label>
  );
}
