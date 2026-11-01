"use client";

import { Mail, Phone } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SubmitPriceDialog } from "@/components/forms/SubmitPriceDialog";
import { useCategories } from "@/hooks/useCategories";
import { useI18n } from "@/hooks/useI18n";
import type { SiteSettings } from "@/types/admin";
import { categoryPath } from "@/utils/url";
import { BrandMark } from "./BrandMark";

const link = "text-sm text-white/75 hover:text-white";

// lucide-react এ আর brand icon নেই, তাই ফেসবুকের "f" নিজে এঁকেছি
function FacebookIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M13.5 21v-7h2.4l.4-3h-2.8V9.1c0-.9.3-1.5 1.6-1.5h1.3V4.9c-.3 0-1.1-.1-2-.1-2 0-3.4 1.2-3.4 3.5V11H8.5v3H11v7h2.5Z" />
    </svg>
  );
}

function YouTubeIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31.6 31.6 0 0 0 0 12a31.6 31.6 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31.6 31.6 0 0 0 24 12a31.6 31.6 0 0 0-.5-5.8ZM9.6 15.6V8.4l6.3 3.6-6.3 3.6Z" />
    </svg>
  );
}

export function SiteFooter({ settings }: { settings: SiteSettings }) {
  const { t, num, lang, prefix } = useI18n();
  const { categories } = useCategories();
  const pathname = usePathname();
  const siteName = lang === "en" && settings.nameEn ? settings.nameEn : settings.name;
  // পণ্যের পাতায় নিচে "কেনার" বার থাকে (bottom 4rem), তাই মোবাইল স্ট্রিপ আরও উপরে
  const lifted = /\/product\//.test(pathname);
  const socials = [
    settings.facebook && { href: settings.facebook, label: "Facebook", icon: FacebookIcon },
    settings.youtube && { href: settings.youtube, label: "YouTube", icon: YouTubeIcon },
  ].filter(Boolean) as { href: string; label: string; icon: typeof FacebookIcon }[];

  return (
    <>
      <footer className="mt-12 hidden bg-hero text-white md:block">
        <div className="page-container grid gap-8 py-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-3">
            <Link href={`${prefix}/`} className="flex items-center gap-2 text-xl font-bold">
              <BrandMark size={32} inverted />
              {siteName}
            </Link>
            <p className="text-sm text-white/75">{(lang === "en" ? settings.taglineEn : settings.tagline) || t.footer.tagline}</p>
          </div>
          <nav aria-label={t.footer.categories} className="flex flex-col gap-2">
            <span className="mb-1 text-sm font-bold">{t.footer.categories}</span>
            <div className="thin-scrollbar grid max-h-60 grid-cols-2 gap-x-6 gap-y-2 overflow-y-auto pr-2">
              {categories.map((c) => (
                <Link key={c.slug} href={categoryPath(prefix, c.slug)} className={link}>
                  {lang === "en" ? c.nameEn : c.name}
                </Link>
              ))}
            </div>
          </nav>
          <nav aria-label={t.footer.explore} className="flex flex-col gap-2">
            <span className="mb-1 text-sm font-bold">{t.footer.explore}</span>
            <Link href={`${prefix}/search/?sort=drop`} className={link}>
              {t.home.drops}
            </Link>
            <Link href={`${prefix}/sellers/`} className={link}>
              {t.nav.sellers}
            </Link>
            <Link href={`${prefix}/saved/`} className={link}>
              {t.nav.saved}
            </Link>
            <Link href={`${prefix}/about/`} className={link}>
              {t.about.title}
            </Link>
            <Link href={`${prefix}/faq/`} className={link}>
              {t.faq.title}
            </Link>
            <Link href={`${prefix}/contact/`} className={link}>
              {t.contact.title}
            </Link>
            <SubmitPriceDialog
              trigger={(open) => (
                <button type="button" onClick={open} className={`${link} text-left`}>
                  {t.footer.reportPrice}
                </button>
              )}
            />
          </nav>
          {(settings.phone || settings.email || settings.facebook || settings.youtube) && (
            <div className="flex flex-col gap-2">
              <span className="mb-1 text-sm font-bold">{t.footer.contact}</span>
              {settings.phone && (
                <a href={`tel:${settings.phone}`} className={`${link} flex items-center gap-2`}>
                  <Phone size={15} aria-hidden="true" />
                  {settings.phone}
                </a>
              )}
              {settings.email && (
                <a href={`mailto:${settings.email}`} className={`${link} flex items-center gap-2`}>
                  <Mail size={15} aria-hidden="true" />
                  {settings.email}
                </a>
              )}
              {settings.facebook && (
                <a href={settings.facebook} target="_blank" rel="noopener" className={`${link} flex items-center gap-2`}>
                  <FacebookIcon size={15} />
                  Facebook
                </a>
              )}
              {settings.youtube && (
                <a href={settings.youtube} target="_blank" rel="noopener" className={`${link} flex items-center gap-2`}>
                  <YouTubeIcon size={15} />
                  YouTube
                </a>
              )}
            </div>
          )}
        </div>
        <div className="border-t border-white/10">
          <div className="page-container flex flex-wrap items-center justify-between gap-x-6 gap-y-2 py-4">
            <p className="text-xs text-white/60">{t.footer.rights(siteName, num(new Date().getFullYear()))}</p>
            <nav aria-label={t.footer.more} className="flex gap-4">
              <Link href={`${prefix}/privacy/`} className="text-xs text-white/60 hover:text-white">
                {t.privacy.title}
              </Link>
              <Link href={`${prefix}/terms/`} className="text-xs text-white/60 hover:text-white">
                {t.terms.title}
              </Link>
            </nav>
          </div>
        </div>
      </footer>

      {/* মোবাইলে ফুটারের বদলে ছোট, হালকা একটা সারি */}
      <nav
        aria-label={t.footer.follow}
        className={`border-t border-line-soft bg-surface md:hidden ${lifted ? "pb-[calc(8.5rem+env(safe-area-inset-bottom))]" : "pb-[calc(5rem+env(safe-area-inset-bottom))]"}`}
      >
        <div className="page-container flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-3">
          <div className="flex items-center gap-2.5">
            <span className="text-[11px] font-semibold text-dim">{t.footer.follow}</span>
            {socials.map(({ href, label, icon: Icon }) => (
              <a
                key={href}
                href={href}
                target="_blank"
                rel="noopener"
                aria-label={label}
                className="flex size-8 items-center justify-center rounded-full bg-brand-soft text-brand-text transition hover:bg-brand hover:text-brand-ink active:scale-95"
              >
                <Icon size={15} />
              </a>
            ))}
          </div>
          <div className="flex gap-4 text-[11px] text-dim">
            <Link href={`${prefix}/privacy/`} className="hover:text-brand">
              {t.privacy.title}
            </Link>
            <Link href={`${prefix}/terms/`} className="hover:text-brand">
              {t.terms.title}
            </Link>
          </div>
        </div>
      </nav>
    </>
  );
}
