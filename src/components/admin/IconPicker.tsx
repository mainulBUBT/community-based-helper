"use client";

import { useState } from "react";
import { CATEGORY_ICON_NAMES, CategoryIcon } from "@/components/product/CategoryIcon";

export function IconPicker({ name, defaultValue }: { name: string; defaultValue: string }) {
  const [value, setValue] = useState(defaultValue);
  return (
    <div className="flex flex-col gap-1.5 text-sm font-semibold">
      <input type="hidden" name={name} value={value} />
      <span className="flex items-center gap-2">
        <span className="flex size-11 items-center justify-center rounded-lg bg-brand-soft text-brand">
          <CategoryIcon name={value} size={20} />
        </span>
        <span className="font-normal text-dim">{value}</span>
      </span>
      <div className="grid max-h-56 grid-cols-6 gap-1 overflow-y-auto rounded-lg border border-line p-2 sm:grid-cols-8 md:grid-cols-10">
        {CATEGORY_ICON_NAMES.map((icon) => (
          <button
            key={icon}
            type="button"
            aria-label={icon}
            title={icon}
            onClick={() => setValue(icon)}
            className={`flex size-9 items-center justify-center rounded-md transition-colors ${value === icon ? "bg-brand text-brand-ink" : "text-dim hover:bg-surface-2 hover:text-ink"}`}
          >
            <CategoryIcon name={icon} size={17} />
          </button>
        ))}
      </div>
    </div>
  );
}
