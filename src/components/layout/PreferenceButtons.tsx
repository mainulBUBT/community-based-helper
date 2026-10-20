"use client";

import { Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";
import { useI18n } from "@/hooks/useI18n";
import { setTheme, themeStore, type ThemeChoice } from "@/lib/preferences";


const button = "flex size-10 items-center justify-center rounded-lg border border-line text-ink hover:border-brand";

export function ThemeButton() {
  const { t } = useI18n();
  const theme = useSyncExternalStore(themeStore.subscribe, themeStore.get, (): ThemeChoice => "light");
  const next = theme === "light" ? "dark" : "light";
  const Icon = next === "dark" ? Moon : Sun;
  return (
    <button type="button" onClick={() => setTheme(next)} aria-label={t.common.theme[next]} title={t.common.theme[next]} className={button}>
      <Icon size={18} aria-hidden="true" />
    </button>
  );
}

export function LanguageButton() {
  const { lang, t, setLang } = useI18n();
  return (
    <button
      type="button"
      onClick={() => setLang(lang === "bn" ? "en" : "bn")}
      aria-label={t.common.languageLabel}
      lang={lang === "bn" ? "en" : "bn"}
      className={`${button} w-auto px-3 text-sm font-bold`}
    >
      {t.common.language}
    </button>
  );
}
