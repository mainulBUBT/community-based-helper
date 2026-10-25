"use client";

import { useAdminI18n } from "@/hooks/useAdminI18n";

export function LanguageButton({ className }: { className?: string }) {
  const { lang, t, setLang } = useAdminI18n();
  return (
    <button
      type="button"
      onClick={() => setLang(lang === "bn" ? "en" : "bn")}
      aria-label={t.common.languageLabel}
      lang={lang === "bn" ? "en" : "bn"}
      className={
        className ??
        "flex h-10 items-center self-start rounded-xl border border-white/15 px-3 text-sm font-bold text-white hover:bg-white/10"
      }
    >
      {t.common.language}
    </button>
  );
}
