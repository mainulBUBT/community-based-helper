"use client";

import { ExternalLink, MessageCircle, Phone } from "lucide-react";
import { useI18n } from "@/hooks/useI18n";
import type { Seller } from "@/types/catalog";
import { telLink, whatsappLink } from "@/utils/format";

const button = "flex h-11 flex-1 items-center justify-center gap-2 rounded-lg text-[15px] font-semibold";

export function SellerContact({ seller, url }: { seller: Seller; url?: string | null }) {
  const { t } = useI18n();
  const link = url ?? seller.website;
  if (link) {
    return (
      <a href={link} target="_blank" rel="noopener nofollow" className={`${button} border border-brand text-brand hover:bg-brand-soft`}>
        {t.seller.visit(seller.name)}
        <ExternalLink size={16} aria-hidden="true" />
      </a>
    );
  }
  return (
    <div className="flex flex-col gap-2">
      {seller.phone && (
        <p className="text-sm">
          {t.seller.phone}: <span className="font-bold tracking-wide">{seller.phone}</span>
        </p>
      )}
      <div className="flex gap-2">
        {seller.phone && (
          <a href={telLink(seller.phone)} className={`${button} bg-brand text-brand-ink hover:bg-brand-hover`}>
            <Phone size={17} aria-hidden="true" />
            {t.seller.call}
          </a>
        )}
        {seller.whatsapp && (
          <a href={whatsappLink(seller.whatsapp)} target="_blank" rel="noopener" className={`${button} border border-line hover:border-brand`}>
            <MessageCircle size={17} aria-hidden="true" />
            WhatsApp
          </a>
        )}
      </div>
    </div>
  );
}
