"use client";

import { useSyncExternalStore } from "react";
import { createStore } from "@/lib/create-store";
import type { Lang } from "@/lib/preferences";
import { showToast } from "@/lib/toast";
import { syncAlert } from "@/services/price-alerts";

const STORAGE_KEY = "saved-products";
const NONE: string[] = [];

function readSaved(): string[] {
  if (typeof window === "undefined") return NONE;
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(value) ? value : NONE;
  } catch {
    return NONE;
  }
}

const savedStore = createStore(readSaved());

interface ToggleText {
  saved: string;
  removed: string;
  saveFailed: string;
}

function toggle(slug: string, text: ToggleText, lang: Lang) {
  const slugs = savedStore.get();
  const saved = slugs.includes(slug);
  const next = saved ? slugs.filter((s) => s !== slug) : [slug, ...slugs];
  savedStore.set(next);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    showToast(text.saveFailed);
    return;
  }
  showToast(saved ? text.removed : text.saved);
  syncAlert(slug, !saved, lang).catch(() => {});
}

export function useSaved() {
  const slugs = useSyncExternalStore(savedStore.subscribe, savedStore.get, () => NONE);
  return { slugs, isSaved: (slug: string) => slugs.includes(slug), toggle };
}
