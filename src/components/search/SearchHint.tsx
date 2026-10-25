"use client";

import { useEffect, useState } from "react";
import { useCategories } from "@/hooks/useCategories";
import { useI18n } from "@/hooks/useI18n";

const STEP_MS = 2500;

function interleave(a: string[], b: string[]): string[] {
  const out: string[] = [];
  for (let i = 0; i < Math.max(a.length, b.length); i++) out.push(...[a[i], b[i]].filter(Boolean));
  return [...new Set(out)];
}

// "কী খুঁজছেন? যেমন" স্থির থাকে, পাশের শব্দ (জনপ্রিয় খোঁজ আর ক্যাটাগরি পালা করে) উপরে স্ক্রল করে বদলায়
export function SearchHint({ examples = [] }: { examples?: string[] }) {
  const { t, lang } = useI18n();
  const { categories } = useCategories();
  const words = interleave(
    examples,
    categories.filter((c) => c.active).map((c) => (lang === "en" ? c.nameEn : c.name)),
  );
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (words.length < 2) return;
    const timer = setInterval(() => setIndex((i) => i + 1), STEP_MS);
    return () => clearInterval(timer);
  }, [words.length]);

  const current = words[index % words.length];
  const previous = index > 0 ? words[(index - 1) % words.length] : null;

  return (
    <span aria-hidden="true" className="pointer-events-none absolute inset-0 flex items-center gap-1 overflow-hidden text-base whitespace-nowrap text-dim">
      {t.search.hintLead}
      <span className="relative h-6 min-w-0 flex-1 overflow-hidden leading-6">
        {previous && (
          <span key={`out-${index}`} className="absolute inset-x-0 top-0 animate-ticker-out truncate motion-reduce:hidden">
            {previous}
          </span>
        )}
        <span key={`in-${index}`} className={`absolute inset-x-0 top-0 truncate ${previous ? "animate-ticker-in motion-reduce:animate-none" : ""}`}>
          {current}
        </span>
      </span>
    </span>
  );
}
