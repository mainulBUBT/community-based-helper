import type { ReactNode } from "react";

const TONES = {
  brand: "bg-brand-soft text-brand-text",
  gold: "bg-gold-soft text-gold-text",
  ok: "bg-ok-soft text-ok",
  neutral: "bg-surface-2 text-dim",
  solid: "bg-gold text-gold-ink",
};

export function Badge({ tone = "neutral", children }: { tone?: keyof typeof TONES; children: ReactNode }) {
  return <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold ${TONES[tone]}`}>{children}</span>;
}
