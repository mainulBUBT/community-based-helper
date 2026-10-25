"use client";

import { useEffect, useRef, useState } from "react";
import { loadTurnstile, TURNSTILE_SITE_KEY } from "@/lib/turnstile";

// টোকেন একবারই চলে, তাই প্রতিটা চেষ্টার পরে resetKey বাড়িয়ে নতুন টোকেন নেওয়া হয়
interface TurnstileProps {
  action: string;
  resetKey: number;
  onToken: (token: string | null) => void;
  labels: { unavailable: string; retry: string };
}

export function Turnstile({ action, resetKey, onToken, labels }: TurnstileProps) {
  const box = useRef<HTMLDivElement>(null);
  const widget = useRef<string | null>(null);
  const report = useRef(onToken);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

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
          "error-callback": () => {
            report.current(null);
            setFailed(true);
          },
        });
      })
      .catch(() => {
        report.current(null);
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
      if (widget.current) window.turnstile?.remove(widget.current);
      widget.current = null;
    };
  }, [action, attempt]);

  useEffect(() => {
    if (resetKey === 0 || !widget.current) return;
    window.turnstile?.reset(widget.current);
    report.current(null);
  }, [resetKey]);

  // স্ক্রিপ্ট লোড না হলে বোতাম চিরকাল "যাচাই হচ্ছে" এ আটকে থাকত; এখন কারণ আর আবার চেষ্টার উপায় দেখায়
  return (
    <div className="flex flex-col gap-2">
      <div ref={box} className={failed ? "" : "min-h-[65px]"} />
      {failed && (
        <div role="alert" className="flex flex-col items-start gap-2 text-sm text-danger">
          {labels.unavailable}
          <button
            type="button"
            onClick={() => {
              setFailed(false);
              setAttempt((n) => n + 1);
            }}
            className="h-9 rounded-lg border border-line px-3 font-semibold text-ink hover:border-brand"
          >
            {labels.retry}
          </button>
        </div>
      )}
    </div>
  );
}
