"use client";

import { Bookmark } from "lucide-react";
import { useI18n } from "@/hooks/useI18n";
import { useSaved } from "@/hooks/useSaved";

export function SaveButton({ slug, compact = false }: { slug: string; compact?: boolean }) {
  const { t, lang } = useI18n();
  const { isSaved, toggle } = useSaved();
  const saved = isSaved(slug);
  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={saved ? t.product.unsave : t.product.save}
      onClick={() => toggle(slug, t.product, lang)}
      className={`relative z-10 flex items-center justify-center rounded-lg border ${compact ? "size-9 border-transparent bg-surface/90 shadow-sm" : "size-11 bg-surface"} ${
        saved ? "border-brand text-brand" : "border-line text-dim hover:text-brand"
      }`}
    >
      <Bookmark size={compact ? 17 : 20} fill={saved ? "currentColor" : "none"} aria-hidden="true" />
    </button>
  );
}
