import type { Metadata } from "next";
import { bn } from "@/i18n/bn";
import { en } from "@/i18n/en";
import type { Lang } from "@/lib/preferences";
import { getSiteSettings } from "@/services/catalog.server";
import { toEnPath } from "@/utils/locale-path";

export const messages = (lang: Lang) => (lang === "en" ? en : bn);

interface PageMeta {
  lang: Lang;
  // বাংলা পথ; English পথ এখান থেকেই বানানো হয়
  path: string;
  title?: string;
  // পুরো শিরোনাম (সাইটের নামসহ) Google এর ~৬৫ অক্ষরের বেশি হলে এটা
  shortTitle?: string;
  description?: string;
  image?: string | null;
  index?: boolean;
}

// প্রতিটা পেজের canonical, দুই ভাষার hreflang (x-default বাংলা), Open Graph আর Twitter card এক জায়গা থেকে
const MAX_TITLE = 65;

export async function pageMeta({ lang, path, title: fullTitle, shortTitle, description, image, index = true }: PageMeta): Promise<Metadata> {
  const settings = await getSiteSettings();
  const isEn = lang === "en";
  const url = isEn ? toEnPath(path) : path;
  const siteName = (isEn && settings.nameEn) || settings.name;
  const fits = (text: string) => `${text} | ${siteName}`.length <= MAX_TITLE;
  const title = fullTitle && shortTitle && !fits(fullTitle) ? shortTitle : fullTitle;
  // ছোট শিরোনামও না ধরলে সাইটের নাম বাদ, যাতে পণ্যের নামটা কাটা না পড়ে
  const dropSiteName = Boolean(title && shortTitle && title === shortTitle && !fits(title));
  const shownTitle = title ?? ((isEn && settings.seoTitleEn) || settings.seoTitle);
  // শেয়ারের প্রিভিউতেও সাইটের নাম, ব্রাউজারের ট্যাবের মতো
  const shareTitle = title && !dropSiteName ? `${title} | ${siteName}` : shownTitle;
  const shownDescription = description ?? ((isEn && settings.seoDescriptionEn) || settings.seoDescription);
  const images = [image ? { url: image, alt: shownTitle } : { url: "/icons/icon-512.png", width: 512, height: 512, alt: siteName }];
  return {
    ...(title && !dropSiteName ? { title } : { title: { absolute: shownTitle } }),
    description: shownDescription,
    ...(!index && { robots: { index: false, follow: true } }),
    alternates: { canonical: url, languages: { bn: path, en: toEnPath(path), "x-default": path } },
    openGraph: {
      type: "website",
      title: shareTitle,
      description: shownDescription,
      url,
      siteName,
      locale: isEn ? "en_US" : "bn_BD",
      alternateLocale: isEn ? "bn_BD" : "en_US",
      images,
    },
    twitter: { card: image ? "summary_large_image" : "summary", title: shareTitle, description: shownDescription, images: images.map((i) => i.url) },
  };
}
