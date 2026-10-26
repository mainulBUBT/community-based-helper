"use client";

import { Link2, Share2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/hooks/useI18n";
import { copyLink, nativeShare, SHARE_TARGETS } from "@/lib/share";

// পাতার এখনকার ঠিকানাই শেয়ার হয়, তাই ফিল্টার/সাজানো সহ পুরো তালিকা যায়
export function ShareButton({ title, label, className }: { title?: string; label?: boolean; className: string }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const name = () => title ?? document.title;

  useEffect(() => {
    if (!open) return;
    const close = (event: Event) => {
      if (event instanceof KeyboardEvent ? event.key === "Escape" : !box.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  const item = "flex h-10 w-full items-center gap-2.5 px-3 text-left text-sm font-medium text-ink hover:bg-surface-2";

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        aria-label={t.common.share}
        aria-expanded={open}
        onClick={async () => {
          if (open) setOpen(false);
          else if (!(await nativeShare(name()))) setOpen(true);
        }}
        className={className}
      >
        <Share2 size={label ? 16 : 18} aria-hidden="true" />
        {label && <span>{t.common.share}</span>}
      </button>
      {open && (
        <div role="menu" className="absolute top-full right-0 z-40 mt-2 w-48 overflow-hidden rounded-md border border-line bg-surface py-1 shadow-lift">
          {SHARE_TARGETS.map((target) => (
            <a key={target.name} role="menuitem" href={target.href(location.href, name())} target="_blank" rel="noopener" onClick={() => setOpen(false)} className={item}>
              <span className="size-2.5 shrink-0 rounded-full" style={{ background: target.color }} aria-hidden="true" />
              {target.name}
            </a>
          ))}
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              copyLink(t.common);
            }}
            className={`${item} border-t border-line-soft`}
          >
            <Link2 size={15} className="shrink-0 text-dim" aria-hidden="true" />
            {t.common.copyLink}
          </button>
        </div>
      )}
    </div>
  );
}
