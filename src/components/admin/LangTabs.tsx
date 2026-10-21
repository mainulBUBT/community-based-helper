"use client";

import { useState, type ReactNode } from "react";

export type Lang = "en" | "bn";

export function LangSwitch({
  value,
  onChange,
}: {
  value: Lang;
  onChange: (lang: Lang) => void;
}) {
  return (
    <div
      role="tablist"
      className="inline-flex w-fit rounded-lg border border-line bg-surface-2 p-1"
    >
      {(["en", "bn"] as const).map((lang) => (
        <button
          key={lang}
          type="button"
          role="tab"
          aria-selected={value === lang}
          onClick={() => onChange(lang)}
          className={`h-8 rounded-md px-4 text-sm font-semibold transition-colors ${value === lang ? "bg-surface text-ink shadow-sm" : "text-dim hover:text-ink"}`}
        >
          {lang === "en" ? "English" : "বাংলা"}
        </button>
      ))}
    </div>
  );
}

export function LangTabs({
  en,
  bn,
  className = "grid gap-4 md:grid-cols-2",
}: {
  en: ReactNode;
  bn: ReactNode;
  className?: string;
}) {
  const [lang, setLang] = useState<Lang>("en");
  return (
    <div className="flex flex-col gap-4">
      <LangSwitch value={lang} onChange={setLang} />
      <div className={lang === "en" ? className : "hidden"}>{en}</div>
      <div className={lang === "bn" ? className : "hidden"}>{bn}</div>
    </div>
  );
}
