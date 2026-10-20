"use client";

import { Bookmark, Download, House, Laptop, Megaphone, Search, Smartphone, Store, Watch, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, type ReactNode } from "react";
import { BrandMark } from "@/components/layout/BrandMark";
import { LanguageButton, ThemeButton } from "@/components/layout/PreferenceButtons";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SearchBox } from "@/components/search/SearchBox";
import { useI18n } from "@/hooks/useI18n";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";
import type { Messages } from "@/i18n/bn";
import { trackView } from "@/services/analytics";
import type { SiteSettings } from "@/types/admin";
import type { Category } from "@/types/catalog";

const NAV: { href: string; key: keyof Messages["nav"]; icon: LucideIcon }[] = [
  { href: "/", key: "home", icon: House },
  { href: "/search/", key: "search", icon: Search },
  { href: "/sellers/", key: "sellers", icon: Store },
  { href: "/saved/", key: "saved", icon: Bookmark },
];

const CATEGORY_LINKS: { id: Category; icon: LucideIcon }[] = [
  { id: "mobile", icon: Smartphone },
  { id: "apple", icon: Laptop },
  { id: "watch", icon: Watch },
];

const trimSlash = (path: string) => path.replace(/\/+$/, "") || "/";
const stripEn = (path: string) => path.replace(/^\/en(?=\/|$)/, "") || "/";

function InstallButton() {
  const { t } = useI18n();
  const { canInstall, install } = useInstallPrompt();
  if (!canInstall) return null;
  return (
    <button type="button" onClick={install} className="flex h-10 items-center gap-2 rounded-lg bg-gold px-3 text-sm font-bold text-gold-ink">
      <Download size={17} aria-hidden="true" />
      <span className="hidden sm:inline">{t.common.install}</span>
    </button>
  );
}

function Announcement({ settings }: { settings: SiteSettings }) {
  const { lang } = useI18n();
  const text = lang === "en" ? settings.announcementEn || settings.announcement : settings.announcement || settings.announcementEn;
  if (!text) return null;
  const body = (
    <span className="flex items-center justify-center gap-2">
      <Megaphone size={15} aria-hidden="true" />
      {text}
    </span>
  );
  return (
    <div className="bg-gold px-4 py-2 text-center text-[13px] font-semibold text-gold-ink">
      {settings.announcementLink ? (
        <a href={settings.announcementLink} className="underline-offset-2 hover:underline">
          {body}
        </a>
      ) : (
        body
      )}
    </div>
  );
}

function CategoryStrip() {
  const { t, prefix } = useI18n();
  const params = useSearchParams();
  const pathname = trimSlash(stripEn(usePathname()));
  const current = pathname === "/search" ? params.get("category") : null;
  const stripRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = stripRef.current;
    if (!el) return;
    const onWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
      if (el.scrollWidth <= el.clientWidth) return;
      el.scrollLeft += event.deltaY;
      event.preventDefault();
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  return (
    <nav aria-label={t.home.categoryEyebrow} className="bg-bar text-bar-ink">
      <div ref={stripRef} className="no-scrollbar mx-auto flex h-11 max-w-7xl items-center gap-1 overflow-x-auto px-4">
        {CATEGORY_LINKS.map(({ id, icon: Icon }) => (
          <Link
            key={id}
            href={`${prefix}/search/?category=${id}`}
            aria-current={current === id ? "page" : undefined}
            className={`flex h-8 shrink-0 items-center gap-2 rounded-md px-3 text-sm font-semibold ${current === id ? "bg-white/20" : "hover:bg-white/10"}`}
          >
            <Icon size={16} aria-hidden="true" />
            {t.category[id].label}
          </Link>
        ))}
        <span className="mx-2 h-5 w-px shrink-0 bg-white/25" />
        <Link href={`${prefix}/search/?sort=drop`} className="flex h-8 shrink-0 items-center rounded-md px-3 text-sm font-semibold hover:bg-white/10">
          {t.home.drops}
        </Link>
        <Link href={`${prefix}/sellers/`} className="flex h-8 shrink-0 items-center rounded-md px-3 text-sm font-semibold hover:bg-white/10">
          {t.nav.sellers}
        </Link>
      </div>
    </nav>
  );
}

export function AppShell({ settings, children }: { settings: SiteSettings; children: ReactNode }) {
  const pathname = usePathname();
  const current = trimSlash(stripEn(pathname));
  const { t, lang, prefix } = useI18n();
  const siteName = lang === "en" && settings.nameEn ? settings.nameEn : settings.name;
  const isActive = (href: string) => (trimSlash(href) === "/" ? current === "/" : current.startsWith(trimSlash(href)));
  const showSearch = !current.startsWith("/search");

  useEffect(() => trackView(pathname), [pathname]);

  return (
    <div className="flex min-h-dvh flex-col">
      <Announcement settings={settings} />
      <header className="sticky top-0 z-40 shadow-sm">
        <div className="border-b border-line-soft bg-surface">
          <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4">
            <Link href={`${prefix}/`} className="flex shrink-0 items-center gap-2 text-xl font-bold tracking-tight text-ink">
              <BrandMark size={32} />
              {siteName}
            </Link>
            <div className="hidden max-w-xl flex-1 md:block">{showSearch && <SearchBox />}</div>
            <span className="flex-1 md:hidden" />
            <div className="flex items-center gap-2">
              <InstallButton />
              <Link href={`${prefix}/saved/`} aria-label={t.nav.saved} className="hidden size-10 items-center justify-center rounded-lg border border-line text-ink hover:border-brand md:flex">
                <Bookmark size={18} aria-hidden="true" />
              </Link>
              <LanguageButton />
              <ThemeButton />
            </div>
          </div>
          {showSearch && (
            <div className="px-4 pb-3 md:hidden">
              <SearchBox />
            </div>
          )}
        </div>
        <Suspense fallback={<div className="h-11 bg-bar" />}>
          <CategoryStrip />
        </Suspense>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 pt-5 pb-24 md:pb-0">{children}</main>
      <SiteFooter settings={settings} />

      <nav aria-label={t.nav.menu} className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] md:hidden">
        {NAV.map(({ href, key, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={`${prefix}${href}`}
              aria-current={active ? "page" : undefined}
              className={`flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-semibold ${active ? "text-brand" : "text-dim"}`}
            >
              <Icon size={21} aria-hidden="true" />
              {t.nav[key]}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
