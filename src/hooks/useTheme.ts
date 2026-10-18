"use client";

import { useSyncExternalStore } from "react";
import { currentTheme, setTheme, subscribeTheme } from "@/lib/theme";

export function useTheme() {
  const theme = useSyncExternalStore(subscribeTheme, currentTheme, () => null);
  const toggle = () => setTheme(currentTheme() === "dark" ? "light" : "dark");
  return { theme, toggle };
}
