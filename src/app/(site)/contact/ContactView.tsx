import { ContactLinks } from "@/components/layout/ContactLinks";
import { infoBody, infoCard } from "@/components/ui/InfoPage";
import type { Messages } from "@/i18n/bn";
import type { SiteSettings } from "@/types/admin";

export function ContactView({ settings, t, shopsNote }: { settings: SiteSettings; t: Messages["contact"]; shopsNote: string }) {
  const hasContacts = Boolean(settings.email || settings.phone || settings.facebook);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold md:text-2xl">{t.title}</h1>
      <p className={infoBody}>{t.intro}</p>
      {hasContacts && (
        <section className={infoCard}>
          <ContactLinks settings={settings} />
        </section>
      )}
      <p className="text-xs leading-relaxed text-dim">{shopsNote}</p>
    </div>
  );
}
