"use client";

import { useSyncExternalStore } from "react";
import { useLocaleOverride } from "@/lib/locale";
import { adminLangStore, setAdminLang, setLang, type Lang } from "@/lib/preferences";
import { bn } from "@/i18n/bn";
import { en } from "@/i18n/en";
import { toBnDigits } from "@/utils/format";

const MESSAGES = { bn, en };

function build(lang: Lang, set: (lang: Lang) => void, prefix = "") {
  const t = MESSAGES[lang];
  const num = (value: string | number) => (lang === "bn" ? toBnDigits(value) : String(value));

  function ago(iso: string) {
    const minutes = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
    if (minutes < 1) return t.time.now;
    if (minutes < 60) return t.time.minutes(num(minutes));
    const hours = Math.round(minutes / 60);
    if (hours < 24) return t.time.hours(num(hours));
    const days = Math.round(hours / 24);
    return days === 1 ? t.time.yesterday : t.time.days(num(days));
  }

  return { lang, t, num, ago, setLang: set, prefix };
}

export function useI18n() {
  const forced = useLocaleOverride();
  return build(forced ?? "bn", setLang, forced === "en" ? "/en" : "");
}

export function useAdminI18n() {
  const lang = useSyncExternalStore(adminLangStore.subscribe, adminLangStore.get, (): Lang => "en");
  return build(lang, setAdminLang);
}
