import type { ReactNode } from "react";

const TONES = {
  brand: "bg-brand-soft text-brand-text",
  gold: "bg-gold-soft text-gold-text",
  ok: "bg-ok-soft text-ok",
  neutral: "bg-surface-2 text-dim",
  solid: "bg-gold text-gold-ink",
};

const SIZES = {
  md: "rounded-md px-2 py-0.5 text-xs font-semibold",
  sm: "rounded-xs px-1.5 py-0.5 text-[10px] font-bold",
};

export function Badge({ tone = "neutral", size = "md", title, children }: { tone?: keyof typeof TONES; size?: keyof typeof SIZES; title?: string; children: ReactNode }) {
  return (
    <span title={title} className={`inline-flex items-center gap-1 ${SIZES[size]} ${TONES[tone]}`}>
      {children}
    </span>
  );
}
