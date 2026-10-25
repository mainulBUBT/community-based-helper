"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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

export function DealsShelf({
  deals,
  interval,
}: {
  deals: ProductSummary[];
  interval: number;
}) {
  const { t, num, prefix } = useI18n();
  const items = useMemo(() => mixProducts(deals).slice(0, 25), [deals]);
  const trackRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(0);
  const [index, setIndex] = useState(0);
  const [transition, setTransition] = useState(true);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const measure = () => {
      if (track.children.length < 2) return;
      const first = track.children[0] as HTMLElement;
      const second = track.children[1] as HTMLElement;
      const newStep = second.offsetLeft - first.offsetLeft;
      if (newStep > 0) setStep(newStep);
    };
    measure();
    // Re-measure when images load (lazy/eager) and on resize
    const ro = new ResizeObserver(measure);
    ro.observe(track);
    const imgs = track.querySelectorAll("img");
    const onLoad = () => measure();
    imgs.forEach((img) => img.addEventListener("load", onLoad));
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      imgs.forEach((img) => img.removeEventListener("load", onLoad));
      window.removeEventListener("resize", measure);
    };
  }, [items]);

  useEffect(() => {
    if (!items.length || paused || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1 >= items.length ? i : i + 1));
    }, Math.max(1000, interval * 1000));
    return () => clearInterval(id);
  }, [items, paused, interval]);

  // When the last real item is at the left edge, jump back to 0 (no transition)
  useEffect(() => {
    if (index < items.length - 1) return;
    const id = setTimeout(() => {
      setTransition(false);
      setIndex(0);
      requestAnimationFrame(() => setTransition(true));
    }, 500);
    return () => clearTimeout(id);
  }, [index, items.length]);

  // Duplicate enough items so the viewport never runs out of cards while the
  // last real item slides into view (max 5 visible at lg).
  const looped = useMemo(() => {
    if (!items.length) return [];
    const out = [...items];
    while (out.length < items.length + 4) out.push(...items);
    return out;
  }, [items]);

  if (!items.length) return null;

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
        className="overflow-hidden"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
      >
        <div
          ref={trackRef}
          className="flex gap-3"
          style={{
            transform: `translateX(-${index * step}px)`,
            transition: transition ? "transform 500ms ease" : "none",
          }}
        >
          {looped.map((summary, i) => (
            <div
              key={`${summary.product.id}-${i}`}
              className="w-1/2 shrink-0 sm:w-1/3 lg:w-1/5"
            >
              <ProductCard key={summary.product.id} summary={summary} deal={summary.drop} loading={i < 5 ? "eager" : "lazy"} />
            </div>
          ))}
        </div>
      </div>
    </Shelf>
  );
}
