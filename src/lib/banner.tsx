"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { BannerPage, SiteSettings } from "@/types/admin";

export type BannerSettings = Pick<SiteSettings, "bannerEnabled" | "bannerImage" | "bannerImageMobile" | "bannerLink" | "bannerAlt" | "bannerPages">;

const BannerContext = createContext<BannerSettings | null>(null);

export function BannerProvider({ banner, children }: { banner: BannerSettings; children: ReactNode }) {
  return <BannerContext value={banner}>{children}</BannerContext>;
}

export function useBanner(page: BannerPage) {
  const banner = useContext(BannerContext);
  if (!banner?.bannerEnabled || !banner.bannerImage || !banner.bannerLink || !banner.bannerPages.includes(page)) return null;
  return banner;
}
