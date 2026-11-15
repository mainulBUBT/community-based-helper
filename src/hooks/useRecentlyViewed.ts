"use client";

import { useEffect, useSyncExternalStore } from "react";
import { createStore } from "@/lib/create-store";

const STORAGE_KEY = "recently-viewed";
const LIMIT = 12;

export interface ViewedProduct {
  slug: string;
  name: string;
  category: string;
}

const NONE: ViewedProduct[] = [];

const isViewed = (value: unknown): value is ViewedProduct =>
  typeof value === "object" && value !== null && typeof (value as ViewedProduct).slug === "string" && typeof (value as ViewedProduct).name === "string";

function readViewed(): ViewedProduct[] {
  if (typeof window === "undefined") return NONE;
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(value) ? value.filter(isViewed).slice(0, LIMIT) : NONE;
  } catch {
    return NONE;
  }
}

const viewedStore = createStore(readViewed());

function remember(viewed: ViewedProduct) {
  const next = [viewed, ...viewedStore.get().filter((v) => v.slug !== viewed.slug)].slice(0, LIMIT);
  viewedStore.set(next);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {}
}

export function useRecordView({ slug, name, category }: ViewedProduct) {
  useEffect(() => remember({ slug, name, category }), [slug, name, category]);
}

export function useRecentlyViewed() {
  return useSyncExternalStore(viewedStore.subscribe, viewedStore.get, () => NONE);
}
