"use client";

import { useSyncExternalStore } from "react";
import { createStore } from "@/lib/create-store";
import { showToast } from "@/lib/toast";

const STORAGE_KEY = "saved-places";
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

function update(ids: string[]) {
  savedStore.set(ids);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    showToast("এই ব্রাউজারে সেভ রাখা যাচ্ছে না");
  }
}

function toggle(id: string) {
  const ids = savedStore.get();
  const saved = ids.includes(id);
  update(saved ? ids.filter((x) => x !== id) : [id, ...ids]);
  showToast(saved ? "সেভ থেকে সরানো হয়েছে" : "সেভ করা হয়েছে");
}

export function useSaved() {
  const ids = useSyncExternalStore(savedStore.subscribe, savedStore.get, () => NONE);
  return { ids, isSaved: (id: string) => ids.includes(id), toggle };
}
