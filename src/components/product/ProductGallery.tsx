/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";
import { useI18n } from "@/hooks/useI18n";
import type { Product } from "@/types/catalog";
import { ProductIcon } from "./ProductIcon";

const PLACEHOLDER_SLOTS = 4;

export function ProductGallery({ product }: { product: Product }) {
  const { t, num } = useI18n();
  const [active, setActive] = useState(0);
  const images = product.images ?? [];
  const count = images.length > 0 ? images.length : PLACEHOLDER_SLOTS;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex aspect-[4/3] items-center justify-center rounded-lg bg-surface md:aspect-square">
        {images[active] ? (
          <img src={images[active]} alt={`${product.brand} ${product.name}`} className="size-full object-contain p-4" />
        ) : (
          <ProductIcon product={product} size="lg" plain />
        )}
      </div>
      <div className="flex gap-2">
        {Array.from({ length: count }, (_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setActive(i)}
            aria-label={`${t.product.galleryShot} ${num(i + 1)}`}
            aria-current={i === active}
            className={`flex size-16 shrink-0 items-center justify-center rounded-md bg-surface ring-1 transition-shadow ${
              i === active ? "ring-2 ring-brand" : "ring-line hover:ring-brand/60"
            }`}
          >
            {images[i] ? (
              <img src={images[i]} alt="" className="size-full object-contain p-1.5" />
            ) : (
              <ProductIcon product={product} size="sm" plain />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
