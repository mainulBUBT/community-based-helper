import { createStore } from "./create-store";

export type Lang = "bn" | "en";
export type ThemeChoice = "light" | "dark";

const LANG_KEY = "lang";
const THEME_KEY = "theme";

export const preferencesInitScript = `try{var t=localStorage.getItem("${THEME_KEY}");if(t==="dark")document.documentElement.dataset.theme=t;var l=localStorage.getItem("${LANG_KEY}");if(l==="en")document.documentElement.lang="en"}catch(e){}`;

function read<T extends string>(key: string, allowed: readonly T[], fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const value = localStorage.getItem(key) as T | null;
    return value && allowed.includes(value) ? value : fallback;
  } catch {
    return fallback;
  }
}

function persist(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {}
}

export const langStore = createStore<Lang>(read(LANG_KEY, ["bn", "en"], "bn"));
export const themeStore = createStore<ThemeChoice>(read(THEME_KEY, ["light", "dark"], "light"));

export function setLang(lang: Lang) {
  langStore.set(lang);
  persist(LANG_KEY, lang);
  document.documentElement.lang = lang;
}

export function setTheme(theme: ThemeChoice) {
  themeStore.set(theme);
  persist(THEME_KEY, theme);
  document.documentElement.dataset.theme = theme;
}
