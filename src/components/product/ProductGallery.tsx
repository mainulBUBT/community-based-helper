/* eslint-disable @next/next/no-img-element */
"use client";

import { ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";
import { useEffect, useRef, useState, useSyncExternalStore, type MouseEvent, type TouchEvent } from "react";
import { useI18n } from "@/hooks/useI18n";
import type { Product } from "@/types/catalog";
import { ProductIcon } from "./ProductIcon";

const ZOOM = 2.2;
const SWIPE = 45;

const hoverQuery = "(hover: hover) and (pointer: fine)";
const canHoverStore = {
  subscribe: (callback: () => void) => {
    const query = window.matchMedia(hoverQuery);
    query.addEventListener("change", callback);
    return () => query.removeEventListener("change", callback);
  },
  get: () => window.matchMedia(hoverQuery).matches,
};

function useSwipe(onSwipe: (direction: 1 | -1) => void, onTap?: () => void) {
  const start = useRef<{ x: number; y: number } | null>(null);
  const moved = useRef(0);
  const [drag, setDrag] = useState(0);
  return {
    drag,
    handlers: {
      onTouchStart: (event: TouchEvent) => {
        if (event.touches.length !== 1) return;
        start.current = { x: event.touches[0].clientX, y: event.touches[0].clientY };
        moved.current = 0;
      },
      onTouchMove: (event: TouchEvent) => {
        if (!start.current || event.touches.length !== 1) return;
        const dx = event.touches[0].clientX - start.current.x;
        const dy = event.touches[0].clientY - start.current.y;
        moved.current = Math.max(moved.current, Math.abs(dx), Math.abs(dy));
        if (Math.abs(dx) > Math.abs(dy)) setDrag(dx);
      },
      onTouchCancel: () => {
        start.current = null;
        setDrag(0);
      },
      onTouchEnd: () => {
        if (!start.current) return;
        if (drag <= -SWIPE) onSwipe(1);
        else if (drag >= SWIPE) onSwipe(-1);
        else if (moved.current < 8) onTap?.();
        start.current = null;
        setDrag(0);
      },
    },
  };
}

function Viewer({ images, index, alt, onClose, onStep }: { images: string[]; index: number; alt: string; onClose: () => void; onStep: (by: 1 | -1) => void }) {
  const { t, num } = useI18n();
  const [zoomed, setZoomed] = useState(false);
  const lastTap = useRef(0);
  const { drag, handlers } = useSwipe((by) => !zoomed && onStep(by));

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight") onStep(1);
      if (event.key === "ArrowLeft") onStep(-1);
    };
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose, onStep]);

  const toggleZoom = () => {
    const now = Date.now();
    if (now - lastTap.current < 300) setZoomed((z) => !z);
    lastTap.current = now;
  };

  return (
    <div role="dialog" aria-modal="true" aria-label={alt} className="fixed inset-0 z-[70] flex flex-col bg-black">
      <div className="flex h-14 shrink-0 items-center justify-between px-4 text-white">
        <span className="text-sm">
          {num(index + 1)}/{num(images.length)}
        </span>
        <button type="button" onClick={onClose} aria-label={t.product.closeViewer} className="flex size-10 items-center justify-center rounded-full bg-white/10">
          <X size={20} aria-hidden="true" />
        </button>
      </div>
      <div className={`relative flex-1 ${zoomed ? "cursor-zoom-out overflow-auto" : "cursor-zoom-in overflow-hidden"}`} {...(zoomed ? {} : handlers)} onClick={toggleZoom}>
        {zoomed ? (
          <img src={images[index]} alt={alt} referrerPolicy="no-referrer" className="max-w-none bg-white" style={{ width: "250%" }} />
        ) : (
          <div className="flex h-full transition-transform duration-200 ease-out" style={{ transform: `translateX(calc(${-index * 100}% + ${drag}px))`, transitionDuration: drag ? "0ms" : undefined }}>
            {images.map((src) => (
              <div key={src} className="flex h-full w-full shrink-0 items-center justify-center bg-white">
                <img src={src} alt={alt} draggable={false} referrerPolicy="no-referrer" className="max-h-full w-full object-contain p-4" />
              </div>
            ))}
          </div>
        )}
      </div>
      <p className="shrink-0 py-3 text-center text-xs text-white/70">{t.product.doubleTapZoom}</p>
    </div>
  );
}

export function ProductGallery({ product, start = 0 }: { product: Product; start?: number }) {
  const { t, num } = useI18n();
  const canHover = useSyncExternalStore(canHoverStore.subscribe, canHoverStore.get, () => true);
  const [active, setActive] = useState(start);
  const [lens, setLens] = useState<{ x: number; y: number } | null>(null);
  const [viewer, setViewer] = useState(false);
  const images = product.images ?? [];
  const current = images[active];
  const alt = `${product.brand} ${product.name}`;
  const step = (by: number) => setActive((i) => (i + by + images.length) % images.length);
  const { drag, handlers } = useSwipe(
    (by) => images.length > 1 && step(by),
    () => current && setViewer(true),
  );

  function moveLens(event: MouseEvent<HTMLDivElement>) {
    if (!canHover) return;
    const box = event.currentTarget.getBoundingClientRect();
    setLens({ x: ((event.clientX - box.left) / box.width) * 100, y: ((event.clientY - box.top) / box.height) * 100 });
  }

  return (
    <div className="flex flex-col gap-2">
      <div
        onMouseMove={current ? moveLens : undefined}
        onMouseLeave={() => setLens(null)}
        {...(canHover ? {} : handlers)}
        className={`group relative aspect-[16/11] touch-pan-y overflow-hidden rounded-lg border border-line-soft bg-white select-none md:aspect-[4/3] ${current && canHover ? "cursor-zoom-in" : ""}`}
      >
        {current ? (
          <div
            className="flex h-full transition-transform duration-300 ease-out"
            style={{ transform: `translateX(calc(${-active * 100}% + ${drag}px))`, transitionDuration: drag ? "0ms" : undefined }}
          >
            {images.map((src, i) => (
              <div key={src} className="flex h-full w-full shrink-0 items-center justify-center overflow-hidden">
                <img
                  src={src}
                  alt={i ? `${alt} ${num(i + 1)}` : alt}
                  draggable={false}
                  referrerPolicy="no-referrer"
                  loading={i === active ? "eager" : "lazy"}
                  fetchPriority={i === start ? "high" : "auto"}
                  style={i === active && lens ? { transform: `scale(${ZOOM})`, transformOrigin: `${lens.x}% ${lens.y}%` } : undefined}
                  className="size-full object-contain p-4 transition-transform duration-150 ease-out md:p-6"
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex size-full items-center justify-center">
            <ProductIcon product={product} size="lg" plain />
          </div>
        )}

        {current && !lens && (
          <span className="pointer-events-none absolute bottom-3 left-3 flex items-center gap-1.5 rounded-md bg-surface/90 px-2 py-1 text-xs text-dim shadow-sm">
            <ZoomIn size={14} aria-hidden="true" />
            {canHover ? t.product.hoverZoom : t.product.tapZoom}
          </span>
        )}

        {images.length > 1 && (
          <>
            {canHover && (
              <>
                <button
                  type="button"
                  onClick={() => step(-1)}
                  aria-label={t.product.prevImage}
                  className="absolute top-1/2 left-2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-surface/90 text-ink opacity-0 shadow-sm transition-opacity group-hover:opacity-100"
                >
                  <ChevronLeft size={18} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => step(1)}
                  aria-label={t.product.nextImage}
                  className="absolute top-1/2 right-2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-surface/90 text-ink opacity-0 shadow-sm transition-opacity group-hover:opacity-100"
                >
                  <ChevronRight size={18} aria-hidden="true" />
                </button>
              </>
            )}
            <span className="absolute right-3 bottom-3 rounded-md bg-surface/90 px-2 py-0.5 text-xs text-dim shadow-sm">
              {num(active + 1)}/{num(images.length)}
            </span>
          </>
        )}
      </div>

      {images.length > 1 && (
        <>
          <div className="flex justify-center gap-1.5 md:hidden" aria-hidden="true">
            {images.map((src, i) => (
              <span key={src} className={`h-1.5 rounded-full transition-all ${i === active ? "w-5 bg-brand" : "w-1.5 bg-line"}`} />
            ))}
          </div>
          <div className="hidden flex-wrap gap-1.5 md:flex">
            {images.map((src, i) => (
              <button
                key={src}
                type="button"
                onClick={() => setActive(i)}
                onMouseEnter={() => setActive(i)}
                aria-label={`${t.product.galleryShot} ${num(i + 1)}`}
                aria-current={i === active}
                className={`flex size-14 shrink-0 items-center justify-center rounded-md bg-white ring-1 transition-shadow ${
                  i === active ? "ring-2 ring-brand" : "ring-line hover:ring-brand/60"
                }`}
              >
                <img src={src} alt={`${product.brand} ${product.name} ${num(i + 1)}`} loading="lazy" referrerPolicy="no-referrer" className="size-full object-contain p-1" />
              </button>
            ))}
          </div>
        </>
      )}

      {viewer && current && <Viewer images={images} index={active} alt={alt} onClose={() => setViewer(false)} onStep={step} />}
    </div>
  );
}
