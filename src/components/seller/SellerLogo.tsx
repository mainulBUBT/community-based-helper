/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";
import type { Seller } from "@/types/catalog";

const logoUrl = (seller: Seller) => {
  if (!seller.website) return null;
  const host = new URL(seller.website).host;
  return `https://www.google.com/s2/favicons?domain=${host}&sz=64`;
};

export function SellerLogo({ seller, size = 28 }: { seller: Seller; size?: number }) {
  const [failed, setFailed] = useState(false);
  const url = logoUrl(seller);
  if (!url || failed) {
    return (
      <span aria-hidden="true" style={{ width: size, height: size }} className="flex shrink-0 items-center justify-center rounded-md bg-brand-soft text-sm font-bold text-brand">
        {seller.name.trim().slice(0, 1)}
      </span>
    );
  }
  return (
    <img
      src={url}
      alt=""
      width={size}
      height={size}
      onError={() => setFailed(true)}
      className="shrink-0 rounded-md bg-surface object-contain ring-1 ring-line"
      style={{ width: size, height: size }}
    />
  );
}
