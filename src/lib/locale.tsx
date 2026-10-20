"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { Lang } from "@/lib/preferences";

const LocaleContext = createContext<Lang | null>(null);

export function LocaleProvider({ lang, children }: { lang: Lang; children: ReactNode }) {
  return <LocaleContext value={lang}>{children}</LocaleContext>;
}

export function useLocaleOverride() {
  return useContext(LocaleContext);
}
