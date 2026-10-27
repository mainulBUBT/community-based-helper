"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/hooks/useI18n";

// এক লাইনেই থাকে; যতগুলো লাইনে আঁটে না সেগুলো "+আরও" চাপলে খোলে
export function BrandRow({ brands, selected, onSelect }: { brands: string[]; selected: string[]; onSelect: (brand: string | null) => void }) {
  const { t, num } = useI18n();
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(0);
  const ordered = [...selected, ...brands.filter((b) => !selected.includes(b))];
  const order = ordered.join("|");
  const isOn = (b: string | null) => (b ? selected.length === 1 && selected[0] === b : !selected.length);

  useEffect(() => {
    const row = ref.current;
    if (!row) return;
    const measure = () => {
      const top = (row.firstElementChild as HTMLElement | null)?.offsetTop ?? 0;
      setHidden([...row.children].filter((c) => (c as HTMLElement).offsetTop > top).length);
    };
    const observer = new ResizeObserver(measure);
    observer.observe(row);
    return () => observer.disconnect();
  }, [order]);

  const chip = (on: boolean) =>
    `h-9 shrink-0 rounded-full border px-4 text-sm font-semibold transition-colors ${on ? "border-brand bg-brand text-brand-ink" : "border-line bg-surface hover:border-brand"}`;

  return (
    <div className="hidden items-start gap-2 md:flex">
      <div ref={ref} className={`flex min-w-0 flex-1 flex-wrap gap-2 ${open ? "" : "max-h-9 overflow-hidden"}`}>
        {[null, ...ordered].map((b) => (
          <button key={b ?? "all"} type="button" aria-pressed={isOn(b)} onClick={() => onSelect(b)} className={chip(isOn(b))}>
            {b ?? t.search.all}
          </button>
        ))}
      </div>
      {hidden > 0 && (
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
          className="flex h-9 shrink-0 items-center gap-1 rounded-full border border-dashed border-line px-3 text-sm font-semibold text-dim hover:border-brand hover:text-ink"
        >
          {open ? t.search.less : t.search.more(num(hidden))}
          {open ? <ChevronUp size={14} aria-hidden="true" /> : <ChevronDown size={14} aria-hidden="true" />}
        </button>
      )}
    </div>
  );
}
