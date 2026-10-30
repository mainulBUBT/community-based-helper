import { Globe, Mail, Phone } from "lucide-react";
import type { SiteSettings } from "@/types/admin";

export function ContactLinks({ settings }: { settings: SiteSettings }) {
  const contacts = [
    settings.email && { href: `mailto:${settings.email}`, icon: Mail, label: settings.email },
    settings.phone && { href: `tel:${settings.phone}`, icon: Phone, label: settings.phone },
    settings.facebook && { href: settings.facebook, icon: Globe, label: "Facebook", external: true },
  ].filter((c): c is { href: string; icon: typeof Mail; label: string; external?: boolean } => Boolean(c));

  return (
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
  );
}
