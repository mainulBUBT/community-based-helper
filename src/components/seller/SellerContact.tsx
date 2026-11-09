"use client";

import { MapPin, MessageCircle, Phone, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { useI18n } from "@/hooks/useI18n";
import type { Seller } from "@/types/catalog";
import { splitList, telLink, whatsappLink } from "@/utils/format";

const link = "font-semibold tracking-wide text-brand hover:underline";

function Line({ icon: Icon, children }: { icon: LucideIcon; children: ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <Icon size={15} className="mt-0.5 shrink-0 text-dim" aria-hidden="true" />
      <span className="flex flex-wrap gap-x-3 gap-y-1">{children}</span>
    </li>
  );
}

export function SellerContact({ seller }: { seller: Seller }) {
  const { t } = useI18n();
  const phones = splitList(seller.phone);
  const whatsapps = splitList(seller.whatsapp);
  const areas = splitList(seller.area);
  if (!phones.length && !whatsapps.length && !areas.length) return null;

  return (
    <ul className="flex flex-col gap-2 border-t border-line-soft pt-3 text-sm">
      {phones.length > 0 && (
        <Line icon={Phone}>
          {phones.map((phone) => (
            <a key={phone} href={telLink(phone)} aria-label={`${t.seller.call} ${phone}`} className={link}>
              {phone}
            </a>
          ))}
        </Line>
      )}
      {whatsapps.length > 0 && (
        <Line icon={MessageCircle}>
          {whatsapps.map((number) => (
            <a key={number} href={whatsappLink(number)} target="_blank" rel="noopener" aria-label={`WhatsApp ${number}`} className={link}>
              {number}
            </a>
          ))}
        </Line>
      )}
      {areas.length > 0 && (
        <Line icon={MapPin}>
          <span className="text-ink">{areas.join(", ")}</span>
        </Line>
      )}
    </ul>
  );
}
