import type { Metadata, Viewport } from "next";
import { SITE_URL } from "@/config/site";
import type { Lang } from "@/lib/preferences";
import { getSiteSettings } from "@/services/catalog.server";

export const viewport: Viewport = {
  themeColor: "#f6f7f9",
  colorScheme: "light",
  viewportFit: "cover",
};

export async function siteMetadata(lang: Lang): Promise<Metadata> {
  const settings = await getSiteSettings();
  const en = lang === "en";
  const name = (en && settings.nameEn) || settings.name;
  const title = (en && settings.seoTitleEn) || settings.seoTitle;
  const description = (en && settings.seoDescriptionEn) || settings.seoDescription;
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: title, template: `%s | ${name}` },
    description,
    applicationName: name,
    appleWebApp: { capable: true, title: name, statusBarStyle: "default" },
    openGraph: { type: "website", siteName: name, locale: en ? "en_US" : "bn_BD", title, description, images: [{ url: "/icons/icon-512.png", width: 512, height: 512, alt: name }] },
    twitter: { card: "summary", title, description, images: ["/icons/icon-512.png"] },
    icons: { icon: "/icons/icon.svg", apple: "/icons/icon-192.png" },
  };
}
