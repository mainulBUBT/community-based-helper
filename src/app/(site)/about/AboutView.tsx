"use client";

import { ContactLinks } from "@/components/layout/ContactLinks";
import { infoBody, infoCard } from "@/components/ui/InfoPage";
import { useI18n } from "@/hooks/useI18n";
import type { SiteSettings } from "@/types/admin";

export function AboutView({ settings }: { settings: SiteSettings }) {
  const { t, lang } = useI18n();
  const en = lang === "en";
  const who = (en ? settings.aboutWhoEn : settings.aboutWho) || settings.aboutWho;
  const what = (en ? settings.aboutWhatEn : settings.aboutWhat) || settings.aboutWhat;
  const hasContacts = Boolean(settings.email || settings.phone || settings.facebook);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold md:text-2xl">{t.about.title}</h1>

      <section className={infoCard}>
        <h2 className="text-base font-bold text-brand-text">{t.about.whoTitle}</h2>
        <p className={infoBody}>{who}</p>
      </section>

      <section className={infoCard}>
        <h2 className="text-base font-bold text-brand-text">{t.about.whatTitle}</h2>
        <p className={infoBody}>{what}</p>
      </section>

      {hasContacts && (
        <section className={infoCard}>
          <h2 className="text-base font-bold text-brand-text">{t.about.contactTitle}</h2>
          <ContactLinks settings={settings} />
        </section>
      )}

      <p className="text-xs leading-relaxed text-dim">{t.about.shopsNote}</p>
    </div>
  );
}
