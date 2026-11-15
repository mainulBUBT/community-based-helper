"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Children, useEffect, useRef, useState, type PointerEvent, type ReactNode } from "react";
import { useI18n } from "@/hooks/useI18n";

// এক কার্ড থেকে পরের কার্ডের দূরত্ব (ফাঁকসহ)
function cardStep(track: HTMLElement): number {
  const [first, second] = track.children as unknown as HTMLElement[];
  return first && second ? second.offsetLeft - first.offsetLeft : track.clientWidth;
}

// ভগ্নাংশ width এ gap বাদ পড়ে, তাই শেষ কার্ড কেটে যেত; calc এ গ্যাপ বাদ দিয়ে ঠিক ফিট করি
export function SlideItem({ children }: { children: ReactNode }) {
  return <div className="w-[calc(50%-6px)] shrink-0 snap-start sm:w-[calc(33.333%-8px)] lg:w-[calc(20%-9.6px)] xl:w-[calc(16.667%-10px)]">{children}</div>;
}

// হাতে সরানো যায়: মোবাইলে সোয়াইপ, ডেস্কটপে মাউসে টেনে বা তীর চেপে; interval দিলে নিজে নিজেও সরে
export function SlideTrack({ children, interval }: { children: ReactNode; interval?: number }) {
  const { t } = useI18n();
  const count = Children.count(children);
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
    if (!interval || count < 2 || paused || dragging || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => slide(1), Math.max(1000, interval * 1000));
    return () => clearInterval(id);
  }, [count, paused, dragging, interval]);

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

  const arrow = "absolute top-1/2 z-10 hidden size-10 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-surface/95 text-ink shadow-lift transition-colors hover:border-brand hover:text-brand md:flex";

  return (
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
        {children}
      </div>
      {count > 2 && (
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
  );
}
