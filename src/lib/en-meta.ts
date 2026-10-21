import type { Metadata } from "next";
import type { SiteSettings } from "@/types/admin";

export const toEnPath = (path: string) => `/en${path === "/" ? "/" : path}`;

export const toBnPath = (path: string) => path.replace(/^\/en(?=\/|$)/, "") || "/";

export function enMeta(opts: { title: string; description: string; path: string; settings: SiteSettings; index?: boolean; absolute?: boolean }): Metadata {
  const name = opts.settings.nameEn || opts.settings.name;
  return {
    title: { absolute: opts.absolute ? opts.title : `${opts.title} | ${name}` },
    description: opts.description,
    ...(opts.index === false && { robots: { index: false } }),
    alternates: { canonical: opts.path, languages: { bn: toBnPath(opts.path), en: opts.path } },
    openGraph: { title: opts.title, description: opts.description, url: opts.path, locale: "en_US", siteName: name },
  };
}
