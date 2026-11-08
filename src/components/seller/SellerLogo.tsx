/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";
import type { Seller } from "@/types/catalog";

const favicon = (website: string | null) => (website ? `https://www.google.com/s2/favicons?domain=${new URL(website).host}&sz=64` : null);

// নিজের লোগো (build এ public/sellers থেকে জানা) আগে, না পেলে Google favicon, তাও না হলে নামের প্রথম অক্ষর
export function SellerLogo({ seller, size = 28 }: { seller: Seller; size?: number }) {
  const [failed, setFailed] = useState(0);
  const sources = [seller.logo, favicon(seller.website)].filter((src): src is string => Boolean(src));
  const src = sources[failed];

  if (!src) {
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
      onError={() => setFailed(failed + 1)}
      className="shrink-0 rounded-md bg-surface object-contain ring-1 ring-line"
      style={{ width: size, height: size }}
    />
  );
}
