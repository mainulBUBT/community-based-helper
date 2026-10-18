"use client";

import Link from "next/link";
import { createElement, useEffect, useRef } from "react";
import { CATEGORIES } from "@/config/categories";
import { categoryPath } from "@/utils/links";

export function CategoryChips({ activeId }: { activeId: string }) {
  const activeRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [activeId]);

  return (
    <nav aria-label="বিভাগ" className="no-scrollbar flex gap-2 overflow-x-auto px-4">
      {CATEGORIES.map((c) => {
        const active = c.id === activeId;
        return (
          <Link
            key={c.id}
            ref={active ? activeRef : undefined}
            href={categoryPath(c.id)}
            aria-current={active ? "page" : undefined}
            className={`flex h-10 shrink-0 items-center gap-1.5 rounded-full border px-3 text-sm font-medium transition-colors ${
              active ? "border-brand bg-brand/12 text-brand" : "border-line text-ink-2 hover:text-ink"
            }`}
          >
            {createElement(c.icon, { size: 16, "aria-hidden": true })}
            {c.short}
          </Link>
        );
      })}
    </nav>
  );
}
