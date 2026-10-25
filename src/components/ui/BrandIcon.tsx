"use client";

import { useState } from "react";

const BRAND_SLUG: Record<string, string> = {
  "Aecooly": "aecooly",
  "Amazfit": "amazfit",
  "Anker": "anker",
  "Apple": "apple",
  "Beauty of Joseon": "beauty-of-joseon",
  "CMF by Nothing": "cmf-by-nothing",
  "COSRX": "cosrx",
  "CeraVe": "cerave",
  "Deconstruct": "deconstruct",
  "Dot & Key": "dot-key",
  "Edifier": "edifier",
  "Havit": "havit",
  "Hoco": "hoco",
  "Huawei": "huawei",
  "JBL": "jbl",
  "LG": "lg",
  "Livon": "livon",
  "OPPO": "oppo",
  "Oraimo": "oraimo",
  "PC Power": "pc-power",
  "Realme": "realme",
  "Redmi": "redmi",
  "Samsung": "samsung",
  "Simple": "simple",
  "Sony": "sony",
  "Streax": "streax",
  "The Derma Co": "the-derma-co",
  "The Ordinary": "the-ordinary",
  "Ugreen": "ugreen",
  "Vivo": "vivo",
  "WARMAC": "warmac",
  "Weofly": "weofly",
  "Xiaomi": "xiaomi",
  "Xundd": "xundd",
};

function slugify(brand: string): string {
  return (
    BRAND_SLUG[brand] ??
    brand
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
  );
}

export function BrandIcon({
  brand,
  size = 24,
  className = "",
}: {
  brand: string;
  size?: number;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const slug = slugify(brand);

  if (failed) {
    return (
      <span
        className={`flex items-center justify-center rounded-sm bg-brand-soft text-xs font-bold text-brand ${className}`}
        style={{ width: size, height: size }}
      >
        {brand.slice(0, 1)}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/brands/${slug}.png`}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      onError={() => setFailed(true)}
      className={`object-contain ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
