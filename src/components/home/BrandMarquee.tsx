"use client";

import Link from "next/link";
import { BrandIcon } from "@/components/ui/BrandIcon";
import { useI18n } from "@/hooks/useI18n";
import { brandPath } from "@/utils/url";

function BrandTile({ brand }: { brand: string }) {
  const { prefix } = useI18n();
  return (
    <Link
      href={brandPath(prefix, brand)}
      className="group flex h-14 w-40 shrink-0 items-center justify-center gap-2.5 rounded-md border border-line bg-surface text-[15px] font-bold tracking-tight text-dim transition-colors hover:border-brand hover:text-brand"
    >
      <BrandIcon brand={brand} size={24} className="size-6" />
      {brand}
    </Link>
  );
}

export function BrandMarquee({ brands }: { brands: string[] }) {
  // দুই কপিই যথেষ্ট: -50% সরলে দ্বিতীয় কপি ঠিক প্রথমটার জায়গায় আসে; গতি ব্র্যান্ডের সংখ্যা ধরে একই থাকে
  const loop = [...brands, ...brands];
  return (
    <div className="brand-marquee-space overflow-hidden">
      <div className="brand-marquee flex w-max gap-3" style={{ animationDuration: `${Math.max(20, brands.length * 0.85)}s` }}>
        {loop.map((brand, i) => (
          <BrandTile key={`${brand}-${i}`} brand={brand} />
        ))}
      </div>
    </div>
  );
}
