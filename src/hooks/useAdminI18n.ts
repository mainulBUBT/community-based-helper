"use client";

import { useSyncExternalStore } from "react";
import { adminBn } from "@/i18n/admin-bn";
import { adminEn } from "@/i18n/admin-en";
import { bn } from "@/i18n/bn";
import { en } from "@/i18n/en";
import { adminLangStore, setAdminLang, type Lang } from "@/lib/preferences";
import { buildI18n } from "./useI18n";

const MESSAGES = { bn: { ...bn, admin: adminBn }, en: { ...en, admin: adminEn } };

export function useAdminI18n() {
  const lang = useSyncExternalStore(adminLangStore.subscribe, adminLangStore.get, (): Lang => "en");
  return buildI18n(MESSAGES[lang], lang, setAdminLang);
}
