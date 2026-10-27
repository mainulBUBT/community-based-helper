"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import { ProductCard } from "@/components/product/ProductCard";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { useI18n } from "@/hooks/useI18n";
import type { ProductSummary } from "@/types/catalog";
import { SectionEyebrow, Shelf } from "./Shelf";

function mixProducts(items: ProductSummary[]): ProductSummary[] {
  const groups = new Map<string, ProductSummary[]>();
  for (const it of items) {
    const key = it.product.category;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(it);
  }
  const buckets = [...groups.values()];
  const out: ProductSummary[] = [];
  let remaining = items.length;
  while (remaining > 0) {
    for (const b of buckets) {
      if (b.length) {
        out.push(b.shift()!);
        remaining--;
      }
    }
  }
  return out;
}

// এক কার্ড থেকে পরের কার্ডের দূরত্ব (ফাঁকসহ)
function cardStep(track: HTMLElement): number {
  const [first, second] = track.children as unknown as HTMLElement[];
  return first && second ? second.offsetLeft - first.offsetLeft : track.clientWidth;
}

// নিজে নিজে সরে, আবার হাতেও: মোবাইলে সোয়াইপ, ডেস্কটপে মাউসে টেনে বা তীর চেপে, দুই দিকেই
export function DealsShelf({
  deals,
  interval,
}: {
  deals: ProductSummary[];
  interval: number;
}) {
  const { t, num, prefix } = useI18n();
  const items = useMemo(() => mixProducts(deals).slice(0, 20), [deals]);
  const trackRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; left: number; moved: boolean } | null>(null);
  const dragged = useRef(false);
  const [paused, setPaused] = useState(false);
  const [dragging, setDragging] = useState(false);

  const slide = (direction: 1 | -1) => {
    const track = trackRef.current;
    if (!track) return;
    const atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
    const atStart = track.scrollLeft <= 4;
    // শেষে পৌঁছালে শুরুতে, শুরু থেকে পেছালে শেষে
    if (direction === 1 && atEnd) track.scrollTo({ left: 0, behavior: "smooth" });
    else if (direction === -1 && atStart) track.scrollTo({ left: track.scrollWidth, behavior: "smooth" });
    else track.scrollBy({ left: direction * cardStep(track), behavior: "smooth" });
  };

  useEffect(() => {
    if (items.length < 2 || paused || dragging || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => slide(1), Math.max(1000, interval * 1000));
    return () => clearInterval(id);
  }, [items, paused, dragging, interval]);

  // টাচে ব্রাউজার নিজেই সরায়; মাউসে টেনে সরানো এখানে, ছাড়লে কাছের কার্ডে থামে
  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse" || e.button !== 0 || !trackRef.current) return;
    drag.current = { x: e.clientX, left: trackRef.current.scrollLeft, moved: false };
    dragged.current = false;
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const track = trackRef.current;
    const start = drag.current;
    if (!track || !start) return;
    const dx = e.clientX - start.x;
    if (!start.moved && Math.abs(dx) < 6) return;
    if (!start.moved) {
      start.moved = true;
      setDragging(true);
      track.setPointerCapture(e.pointerId);
    }
    track.scrollLeft = start.left - dx;
  };
  const onPointerUp = () => {
    const track = trackRef.current;
    const start = drag.current;
    drag.current = null;
    if (!track || !start?.moved) return;
    dragged.current = true;
    setDragging(false);
    const step = cardStep(track);
    track.scrollTo({ left: Math.round(track.scrollLeft / step) * step, behavior: "smooth" });
  };

  if (!items.length) return null;

  const arrow = "absolute top-1/2 z-10 hidden size-10 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-surface/95 text-ink shadow-lift transition-colors hover:border-brand hover:text-brand md:flex";

  return (
    <Shelf>
      <div className="flex flex-col gap-3">
        <SectionEyebrow>{t.home.dropsEyebrow}</SectionEyebrow>
        <SectionHeader
          title={t.home.drops}
          subtitle={t.home.dropsSub}
          href={`${prefix}/search/?sort=drop`}
          linkLabel={t.home.seeAllIn(num(deals.length))}
        />
      </div>
      <div
        className="relative"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
        onTouchStart={() => setPaused(true)}
        onTouchEnd={() => setPaused(false)}
      >
        <div
          ref={trackRef}
          className={`no-scrollbar flex gap-3 overflow-x-auto overscroll-x-contain ${dragging ? "cursor-grabbing snap-none select-none" : "snap-x snap-mandatory md:cursor-grab"}`}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          // টেনে ছাড়ার পরে কার্ডের লিংকে ক্লিক না হয়
          onClickCapture={(e) => {
            if (dragged.current) e.preventDefault();
            dragged.current = false;
          }}
          onDragStart={(e) => e.preventDefault()}
        >
          {items.map((summary, i) => (
            <div key={summary.product.id} className="w-1/2 shrink-0 snap-start sm:w-1/3 lg:w-1/5">
              <ProductCard summary={summary} deal={summary.drop} loading={i < 5 ? "eager" : "lazy"} />
            </div>
          ))}
        </div>
        {items.length > 2 && (
          <>
            <button type="button" onClick={() => slide(-1)} aria-label={t.home.slidePrev} className={`${arrow} -left-3`}>
              <ChevronLeft size={18} aria-hidden="true" />
            </button>
            <button type="button" onClick={() => slide(1)} aria-label={t.home.slideNext} className={`${arrow} -right-3`}>
              <ChevronRight size={18} aria-hidden="true" />
            </button>
          </>
        )}
      </div>
    </Shelf>
  );
}
