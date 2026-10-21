"use client";

import { Moon, Sun } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSyncExternalStore } from "react";
import { useI18n } from "@/hooks/useI18n";
import { toBnPath, toEnPath } from "@/lib/en-meta";
import { setLang, setTheme, themeStore, type ThemeChoice } from "@/lib/preferences";


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
  const { t, prefix } = useI18n();
  const pathname = usePathname();
  const router = useRouter();
  const next = prefix ? "bn" : "en";
  const href = prefix ? toBnPath(pathname) : toEnPath(pathname);
  return (
    <Link
      href={href}
      onClick={(event) => {
        event.preventDefault();
        setLang(next);
        router.push(`${href}${window.location.search}`);
      }}
      aria-label={t.common.languageLabel}
      lang={next}
      className={`${button} w-auto px-3 text-sm font-bold`}
    >
      {t.common.language}
    </Link>
  );
}
