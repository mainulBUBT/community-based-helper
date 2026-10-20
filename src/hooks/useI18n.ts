"use client";

import { useSyncExternalStore } from "react";
import { bn } from "@/i18n/bn";
import { en } from "@/i18n/en";
import { langStore, setLang, type Lang } from "@/lib/preferences";
import { toBnDigits } from "@/utils/format";

const MESSAGES = { bn, en };

export function useI18n() {
  const lang = useSyncExternalStore(langStore.subscribe, langStore.get, (): Lang => "bn");
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

  return { lang, t, num, ago, setLang };
}
