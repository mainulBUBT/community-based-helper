"use client";

/* eslint-disable @next/next/no-img-element */
import { X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useI18n } from "@/hooks/useI18n";
import { trackEvent } from "@/services/analytics";
import type { SiteSettings } from "@/types/admin";

const SEEN_KEY = "popup-seen";
const noSlash = (path: string) => path.replace(/\/+$/, "");
// AppSplash-এর অ্যানিমেশন (globals.css: 1200ms দেরি + 300ms fade) শেষ হওয়ার পর পপআপ
const SPLASH_MS = 1500;

// এই ভিজিটে একবার; একই পোস্টার আবার দেখায় না, নতুন পোস্টার দেখায়
function firstTime(image: string) {
  try {
    if (sessionStorage.getItem(SEEN_KEY) === image) return false;
    sessionStorage.setItem(SEEN_KEY, image);
  } catch {
    // storage বন্ধ থাকলেও পপআপ একবার দেখানো চলে
  }
  return true;
}

export function PromoPopup({ settings }: { settings: SiteSettings }) {
  const { t, prefix } = useI18n();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { popupEnabled, popupImage: image, popupLink: link, popupAlt: alt } = settings;
  const href = link?.startsWith("/") ? `${prefix}${link}` : link;

  // ছবি নেমে গেলে তবেই: পাতার প্রথম লোডে ভার পড়ে না, আর খালি পপআপ দেখায় না
  useEffect(() => {
    if (!popupEnabled || !image || !href) return;
    if (noSlash(pathname) === noSlash(href)) {
      firstTime(image);
      return;
    }
    const poster = new Image();
    let timer: ReturnType<typeof setTimeout> | undefined;
    poster.onload = () => {
      if (!firstTime(image)) return;
      const wait = matchMedia("(display-mode: standalone)").matches ? SPLASH_MS : 0;
      timer = setTimeout(() => {
        trackEvent("popup-view", pathname);
        setOpen(true);
      }, wait);
    };
    poster.src = image;
    return () => {
      poster.onload = null;
      clearTimeout(timer);
    };
  }, [popupEnabled, image, href, pathname]);

  if (!open || !image || !href) return null;
  return (
    <dialog
      ref={(dialog) => {
        if (dialog && !dialog.open) dialog.showModal();
      }}
      aria-label={alt ?? undefined}
      onClose={() => setOpen(false)}
      onClick={(event) => event.target === event.currentTarget && setOpen(false)}
      className="m-auto max-h-dvh w-11/12 max-w-md bg-transparent p-0 backdrop:bg-black/60"
    >
      <div className="mb-2 flex justify-end">
        <button type="button" aria-label={t.common.close} onClick={() => setOpen(false)} className="flex size-11 items-center justify-center rounded-full bg-surface text-ink shadow-lift">
          <X size={22} aria-hidden="true" />
        </button>
      </div>
      <Link href={href} prefetch={false} onClick={() => { trackEvent("popup-click", pathname); setOpen(false); }}>
        <img src={image} alt={alt ?? ""} className="block max-h-dvh w-full rounded-2xl object-contain" />
      </Link>
    </dialog>
  );
}
