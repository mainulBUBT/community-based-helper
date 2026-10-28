"use client";

import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/hooks/useI18n";

const BAR = 44;

// দামের বাক্স পার হলে হেডারের নিচে ভাগের বার; কোন ভাগে আছেন সেটা IntersectionObserver বলে, স্ক্রলের হিসাব নয়
export function SectionNav({ sections, hero }: { sections: { id: string; label: string }[]; hero: string }) {
  const { t } = useI18n();
  const [shown, setShown] = useState(false);
  const [active, setActive] = useState(hero);
  const [top, setTop] = useState(64);
  const track = useRef<HTMLDivElement>(null);
  const ids = sections.map((s) => s.id).join(",");

  useEffect(() => {
    const header = document.querySelector("header");
    if (!header) return;
    const measure = new ResizeObserver(() => setTop(header.offsetHeight));
    measure.observe(header);
    return () => measure.disconnect();
  }, []);

  useEffect(() => {
    const heroEl = document.getElementById(hero);
    if (!heroEl) return;
    const watch = new IntersectionObserver(([entry]) => setShown(!entry.isIntersecting && entry.boundingClientRect.top < 0), { rootMargin: `-${top + BAR}px 0px 0px 0px` });
    watch.observe(heroEl);
    return () => watch.disconnect();
  }, [hero, top]);

  useEffect(() => {
    const visible = new Set<string>();
    const order = ids.split(",");
    const watch = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target.id);
          else visible.delete(entry.target.id);
        }
        const first = order.find((id) => visible.has(id));
        if (first) setActive(first);
      },
      // বারের একটু নিচের ১px লাইন যে ভাগ ছুঁয়ে আছে সেটাই চালু; ফাঁকে পড়লে আগেরটা থাকে
      { rootMargin: `-${top + BAR + 24}px 0px -${Math.max(0, window.innerHeight - top - BAR - 25)}px 0px` },
    );
    for (const id of order) {
      const el = document.getElementById(id);
      if (el) watch.observe(el);
    }
    return () => watch.disconnect();
  }, [ids, top]);

  useEffect(() => {
    const tab = track.current?.querySelector<HTMLElement>(`[data-id="${active}"]`);
    if (tab && track.current) track.current.scrollTo({ left: tab.offsetLeft - 16, behavior: "smooth" });
  }, [active]);

  const go = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - top - BAR - 8, behavior: "smooth" });
    history.replaceState(null, "", `#${id}`);
  };

  return (
    <nav
      aria-label={t.product.sectionsLabel}
      style={{ top }}
      className={`fixed inset-x-0 z-30 border-b border-line bg-surface shadow-sm transition-[transform,opacity] duration-200 ${shown ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-full opacity-0"}`}
      inert={!shown}
    >
      <div ref={track} className="page-container no-scrollbar flex gap-1 overflow-x-auto">
        {sections.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            data-id={s.id}
            aria-current={active === s.id ? "location" : undefined}
            onClick={(e) => {
              e.preventDefault();
              go(s.id);
            }}
            className={`flex h-11 shrink-0 items-center border-b-2 px-2.5 text-[13.5px] whitespace-nowrap transition-colors ${active === s.id ? "border-brand font-bold text-brand-text" : "border-transparent font-medium text-dim hover:text-ink"}`}
          >
            {s.label}
          </a>
        ))}
      </div>
    </nav>
  );
}
