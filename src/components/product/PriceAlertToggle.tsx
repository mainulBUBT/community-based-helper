"use client";

import { Bell, BellOff, BellRing } from "lucide-react";
import { useState } from "react";
import { useI18n } from "@/hooks/useI18n";
import { usePriceAlerts } from "@/hooks/usePriceAlerts";
import { showToast } from "@/lib/toast";
import { disableAlerts, enableAlerts } from "@/services/price-alerts";

export function PriceAlertToggle({ slugs, compact = false }: { slugs: string[]; compact?: boolean }) {
  const { t, lang } = useI18n();
  const state = usePriceAlerts();
  const [busy, setBusy] = useState(false);
  if (state === "unsupported" || (compact && state !== "off")) return null;

  const run = (action: () => Promise<void>) => {
    setBusy(true);
    action()
      .catch(() => showToast(t.alerts.failed))
      .finally(() => setBusy(false));
  };
  const on = state === "on";
  const Icon = on ? BellRing : state === "blocked" ? BellOff : Bell;
  const text = { on: t.alerts.on, off: t.alerts.off, blocked: t.alerts.blocked, install: t.alerts.install }[state];

  return (
    <div className={`flex flex-wrap items-center gap-3 rounded-lg border border-line-soft bg-surface ${compact ? "px-3 py-2" : "p-4"}`}>
      <Icon size={compact ? 18 : 20} className={on ? "text-brand" : "text-dim"} aria-hidden="true" />
      <p className="min-w-0 flex-1 text-sm">{text}</p>
      {(state === "off" || on) && (
        <button
          type="button"
          disabled={busy}
          onClick={() => run(on ? disableAlerts : () => enableAlerts(slugs, lang))}
          className={`h-9 shrink-0 rounded-md px-4 text-sm font-semibold disabled:opacity-60 ${on ? "border border-line hover:border-brand" : "bg-brand text-brand-ink"}`}
        >
          {on ? t.alerts.turnOff : t.alerts.turnOn}
        </button>
      )}
    </div>
  );
}
