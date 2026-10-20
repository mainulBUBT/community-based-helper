"use client";

import { Globe, Mail, Phone } from "lucide-react";
import { useI18n } from "@/hooks/useI18n";
import type { SiteSettings } from "@/types/admin";

const h2 = "text-lg font-bold";
const p = "text-[15px] leading-relaxed text-dim";

export function AboutView({ settings }: { settings: SiteSettings }) {
  const { t } = useI18n();
  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-bold">{t.about.title}</h1>
      <p className={`${p} max-w-2xl`}>{t.about.lead}</p>

      <section className="flex max-w-2xl flex-col gap-2">
        <h2 className={h2}>{t.about.pricesTitle}</h2>
        <ul className="flex flex-col gap-1.5">
          <li className={p}>{t.about.priceStores}</li>
          <li className={p}>{t.about.priceUsers}</li>
          <li className={p}>{t.about.priceSellers}</li>
        </ul>
      </section>

      <section className="flex max-w-2xl flex-col gap-2">
        <h2 className={h2}>{t.about.dataTitle}</h2>
        <p className={p}>{t.about.dataBody}</p>
      </section>

      <section className="flex max-w-2xl flex-col gap-2">
        <h2 className={h2}>{t.about.storesTitle}</h2>
        <p className={p}>{t.about.storesBody}</p>
        <code className="w-fit rounded-md bg-surface-2 px-3 py-1.5 text-sm">DordamBot/1.0</code>
        <p className={p}>{t.about.storesOut}</p>
      </section>

      <section className="flex max-w-2xl flex-col gap-2">
        <h2 className={h2}>{t.about.contactTitle}</h2>
        {settings.phone || settings.email || settings.facebook ? (
          <div className="flex flex-col gap-1.5">
            {settings.phone && (
              <a href={`tel:${settings.phone}`} className="flex items-center gap-2 text-[15px] font-semibold text-brand">
                <Phone size={16} aria-hidden="true" />
                {settings.phone}
              </a>
            )}
            {settings.email && (
              <a href={`mailto:${settings.email}`} className="flex items-center gap-2 text-[15px] font-semibold text-brand">
                <Mail size={16} aria-hidden="true" />
                {settings.email}
              </a>
            )}
            {settings.facebook && (
              <a href={settings.facebook} target="_blank" rel="noopener" className="flex items-center gap-2 text-[15px] font-semibold text-brand">
                <Globe size={16} aria-hidden="true" />
                Facebook
              </a>
            )}
          </div>
        ) : (
          <p className={p}>{t.about.noContact}</p>
        )}
      </section>
    </div>
  );
}
