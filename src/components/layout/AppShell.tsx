"use client";

import { Bookmark, House, MapPin, Phone, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { LocationButton } from "@/components/ui/LocationButton";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { APP } from "@/config/app";
import { useLocateOnOpen } from "@/hooks/useUserLocation";
import { toBnDigits } from "@/utils/bangla";

const NAV: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/", label: "হোম", icon: House },
  { href: "/saved/", label: "সেভ করা", icon: Bookmark },
];

const trimSlash = (path: string) => path.replace(/\/+$/, "") || "/";

function NavItems() {
  const pathname = trimSlash(usePathname());
  return NAV.map(({ href, label, icon: Icon }) => {
    const active = trimSlash(href) === pathname;
    return (
      <Link
        key={href}
        href={href}
        aria-current={active ? "page" : undefined}
        className={`flex flex-1 flex-col items-center justify-center gap-1 text-xs font-medium transition-colors lg:size-14 lg:flex-none lg:rounded-xl ${
          active ? "text-brand lg:bg-brand/12" : "text-dim hover:text-ink"
        }`}
      >
        <Icon size={22} aria-hidden="true" />
        {label}
      </Link>
    );
  });
}

function EmergencyCall() {
  return (
    <a
      href={`tel:${APP.emergencyNumber}`}
      aria-label={`জরুরি সেবা — ${APP.emergencyNumber}-এ কল করুন`}
      className="flex flex-1 flex-col items-center justify-center gap-1 text-xs font-semibold text-danger-soft lg:size-14 lg:flex-none lg:rounded-xl lg:bg-danger lg:text-white"
    >
      <Phone size={20} aria-hidden="true" />
      {toBnDigits(APP.emergencyNumber)}
    </a>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  useLocateOnOpen();
  return (
    <>
      <nav aria-label="প্রধান মেনু" style={{ viewTransitionName: "app-rail" }} className="fixed inset-y-0 left-0 z-[1001] hidden w-[76px] flex-col items-center gap-2 border-r border-line-soft bg-rail py-4 lg:flex">
        <Link href="/" aria-label={APP.name} className="mb-3 flex size-11 items-center justify-center rounded-xl bg-brand text-brand-ink">
          <MapPin size={22} aria-hidden="true" />
        </Link>
        <NavItems />
        <span className="flex-1" />
        <LocationButton variant="rail" />
        <ThemeToggle className="size-12" />
        <EmergencyCall />
      </nav>

      <header
        style={{ viewTransitionName: "app-topbar" }}
        className="sticky top-0 z-[1001] flex h-14 items-center gap-2 border-b border-line-soft bg-rail/95 px-4 backdrop-blur lg:hidden"
      >
        <Link href="/" className="flex shrink-0 items-center gap-2 font-display text-xl">
          <span className="flex size-8 items-center justify-center rounded-lg bg-brand text-brand-ink">
            <MapPin size={17} aria-hidden="true" />
          </span>
          {APP.name}
        </Link>
        <span className="flex-1" />
        <LocationButton />
        <ThemeToggle className="size-10" />
      </header>

      <main className="pb-[72px] lg:pb-0 lg:pl-[76px]">{children}</main>

      <nav aria-label="প্রধান মেনু" style={{ viewTransitionName: "app-tabbar" }} className="fixed inset-x-0 bottom-0 z-[1001] flex h-16 border-t border-line-soft bg-rail/95 backdrop-blur lg:hidden">
        <NavItems />
        <EmergencyCall />
      </nav>
    </>
  );
}
