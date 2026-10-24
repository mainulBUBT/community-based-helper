"use client";

import { useSyncExternalStore } from "react";
import { useLocaleOverride } from "@/lib/locale";
import { adminLangStore, setAdminLang, setLang, type Lang } from "@/lib/preferences";
import { bn } from "@/i18n/bn";
import { en } from "@/i18n/en";
import { toBnDigits } from "@/utils/format";

const MESSAGES = { bn, en };

const subscribeNever = () => () => {};

function build(lang: Lang, set: (lang: Lang) => void, prefix = "", mounted = true) {
  const t = MESSAGES[lang];
  const num = (value: string | number) => (lang === "bn" ? toBnDigits(value) : String(value));

  function ago(iso: string) {
    if (!mounted)
      return new Date(iso).toLocaleDateString(lang === "bn" ? "bn-BD" : "en-GB", {
        day: "numeric",
        month: "short",
        timeZone: "Asia/Dhaka",
      });
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
  // স্ট্যাটিক সাইটে বিল্ড-টাইম আর দেখার সময় আলাদা — mount-এর আগে ago() নির্ধারিত তারিখ দেয়,
  // না হলে React hydration মিসম্যাচ (#418) হয়ে পেজ ক্লায়েন্টে ভেঙে যায়।
  const mounted = useSyncExternalStore(subscribeNever, () => true, () => false);
  return build(forced ?? "bn", setLang, forced === "en" ? "/en" : "", mounted);
}

export function useAdminI18n() {
  const lang = useSyncExternalStore(adminLangStore.subscribe, adminLangStore.get, (): Lang => "en");
  return build(lang, setAdminLang);
}
