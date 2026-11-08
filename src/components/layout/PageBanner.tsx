"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/hooks/useI18n";
import { useBanner } from "@/lib/banner";
import { trackEvent } from "@/services/analytics";
import type { BannerPage } from "@/types/admin";

// ছবি যেমন আছে তেমন দেখায়, তাই GIF বা চলমান WebP চলমানই থাকে; চওড়া পর্দায় ডেস্কটপের ছবি, নইলে মোবাইলের
export function PageBanner({ page }: { page: BannerPage }) {
  const banner = useBanner(page);
  const { prefix } = useI18n();
  const pathname = usePathname();
  if (!banner?.bannerImage || !banner.bannerLink) return null;

  const { bannerImage, bannerImageMobile, bannerLink, bannerAlt } = banner;
  const href = bannerLink.startsWith("/") ? `${prefix}${bannerLink}` : bannerLink;

  return (
    <Link
      href={href}
      prefetch={false}
      onClick={() => trackEvent("banner-click", pathname)}
      className="block overflow-hidden rounded-lg ring-1 ring-line"
    >
      <picture>
        {bannerImageMobile && <source media="(min-width: 768px)" srcSet={bannerImage} width={1600} height={200} />}
        <img
          src={bannerImageMobile ?? bannerImage}
          alt={bannerAlt ?? ""}
          width={bannerImageMobile ? 1200 : 1600}
          height={bannerImageMobile ? 400 : 200}
          className="block h-auto w-full"
        />
      </picture>
    </Link>
  );
}
