/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";
import type { Seller } from "@/types/catalog";

const LOGO_EXT: Record<string, string> = {
  "54a6a76b-b888-4e1f-9684-01ded818a73f": "ico",
  "12c25688-4bbe-447b-b6d9-c72fee140af9": "jpg",
  "eace1aeb-976e-4eba-93ed-07c39d1c88aa": "gif",
};

export function SellerLogo({ seller, size = 28 }: { seller: Seller; size?: number }) {
  const [src, setSrc] = useState<string | null>(`/sellers/${seller.id}.${LOGO_EXT[seller.id] ?? "png"}`);
  const [triedGoogle, setTriedGoogle] = useState(false);
  const google = seller.website ? `https://www.google.com/s2/favicons?domain=${new URL(seller.website).host}&sz=64` : null;

  if (src === null) {
    return (
      <span aria-hidden="true" style={{ width: size, height: size }} className="flex shrink-0 items-center justify-center rounded-md bg-brand-soft text-sm font-bold text-brand">
        {seller.name.trim().slice(0, 1)}
      </span>
    );
  }

  return (
    <img
      src={src}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      onError={() => {
        if (!triedGoogle && google && src !== google) {
          setTriedGoogle(true);
          setSrc(google);
        } else {
          setSrc(null);
        }
      }}
      className="shrink-0 rounded-md bg-surface object-contain ring-1 ring-line"
      style={{ width: size, height: size }}
    />
  );
}
