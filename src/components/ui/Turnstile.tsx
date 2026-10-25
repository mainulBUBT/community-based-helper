"use client";

import { useEffect, useRef } from "react";
import { loadTurnstile, TURNSTILE_SITE_KEY } from "@/lib/turnstile";

// টোকেন একবারই চলে, তাই প্রতিটা চেষ্টার পরে resetKey বাড়িয়ে নতুন টোকেন নেওয়া হয়
export function Turnstile({ action, resetKey, onToken }: { action: string; resetKey: number; onToken: (token: string | null) => void }) {
  const box = useRef<HTMLDivElement>(null);
  const widget = useRef<string | null>(null);
  const report = useRef(onToken);

  useEffect(() => {
    report.current = onToken;
  });

  useEffect(() => {
    let cancelled = false;
    loadTurnstile()
      .then((turnstile) => {
        if (cancelled || !box.current) return;
        widget.current = turnstile.render(box.current, {
          sitekey: TURNSTILE_SITE_KEY,
          action,
          size: "flexible",
          callback: (token: string) => report.current(token),
          "expired-callback": () => report.current(null),
          "error-callback": () => report.current(null),
        });
      })
      .catch(() => report.current(null));
    return () => {
      cancelled = true;
      if (widget.current) window.turnstile?.remove(widget.current);
      widget.current = null;
    };
  }, [action]);

  useEffect(() => {
    if (resetKey === 0 || !widget.current) return;
    window.turnstile?.reset(widget.current);
    report.current(null);
  }, [resetKey]);

  return <div ref={box} className="min-h-[65px]" />;
}
