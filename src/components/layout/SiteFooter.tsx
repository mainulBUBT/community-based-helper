"use client";

import { Mail, Phone } from "lucide-react";
import Link from "next/link";
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

export function SiteFooter({ settings }: { settings: SiteSettings }) {
  const { t, num, lang, prefix } = useI18n();
  const { categories } = useCategories();
  const siteName = lang === "en" && settings.nameEn ? settings.nameEn : settings.name;
  return (
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
          <SubmitPriceDialog
            trigger={(open) => (
              <button type="button" onClick={open} className={`${link} text-left`}>
                {t.footer.reportPrice}
              </button>
            )}
          />
        </nav>
        {(settings.phone || settings.email || settings.facebook) && (
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
          </div>
        )}
      </div>
      <div className="border-t border-white/10">
        <p className="page-container py-4 text-xs text-white/60">{t.footer.rights(siteName, num(new Date().getFullYear()))}</p>
      </div>
    </footer>
  );
}
