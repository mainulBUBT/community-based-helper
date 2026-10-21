"use client";

import { Globe, Mail, Phone } from "lucide-react";
import { useI18n } from "@/hooks/useI18n";
import type { SiteSettings } from "@/types/admin";

const card = "flex flex-col gap-2 rounded-lg bg-surface p-5 ring-1 ring-line-soft md:p-6";
const body = "text-[15px] leading-relaxed text-ink";

export function AboutView({ settings }: { settings: SiteSettings }) {
  const { t, lang } = useI18n();
  const en = lang === "en";
  const who = (en ? settings.aboutWhoEn : settings.aboutWho) || settings.aboutWho;
  const what = (en ? settings.aboutWhatEn : settings.aboutWhat) || settings.aboutWhat;
  const contacts = [
    settings.email && { href: `mailto:${settings.email}`, icon: Mail, label: settings.email },
    settings.phone && { href: `tel:${settings.phone}`, icon: Phone, label: settings.phone },
    settings.facebook && { href: settings.facebook, icon: Globe, label: "Facebook", external: true },
  ].filter((c): c is { href: string; icon: typeof Mail; label: string; external?: boolean } => Boolean(c));

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <h1 className="text-xl font-bold md:text-2xl">{t.about.title}</h1>

      <section className={card}>
        <h2 className="text-base font-bold text-brand-text">{t.about.whoTitle}</h2>
        <p className={body}>{who}</p>
      </section>

      <section className={card}>
        <h2 className="text-base font-bold text-brand-text">{t.about.whatTitle}</h2>
        <p className={body}>{what}</p>
      </section>

      {contacts.length > 0 && (
        <section className={card}>
          <h2 className="text-base font-bold text-brand-text">{t.about.contactTitle}</h2>
          <div className="flex flex-wrap gap-2">
            {contacts.map(({ href, icon: Icon, label, external }) => (
              <a
                key={href}
                href={href}
                {...(external ? { target: "_blank", rel: "noopener" } : {})}
                className="flex h-10 items-center gap-2 rounded-md border border-line px-3.5 text-sm font-semibold text-ink hover:border-brand hover:text-brand"
              >
                <Icon size={16} aria-hidden="true" />
                {label}
              </a>
            ))}
          </div>
        </section>
      )}

      <p className="text-xs leading-relaxed text-dim">{t.about.shopsNote}</p>
    </div>
  );
}
