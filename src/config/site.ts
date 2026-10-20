import type { Category, Condition, SellerKind } from "@/types/catalog";
import type { SiteSettings } from "@/types/admin";

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://sashroy.pages.dev").replace(/\/+$/, "");

export const DEFAULT_SETTINGS: SiteSettings = {
  name: "সাশ্রয়",
  tagline: "মোবাইল, Apple আর স্মার্টওয়াচের দাম এক জায়গায়",
  phone: null,
  email: null,
  facebook: null,
  logoUrl: null,
  seoTitle: "সাশ্রয়: মোবাইল আর গ্যাজেটের দাম তুলনা",
  seoDescription: "বাংলাদেশের দোকানগুলোতে মোবাইল, iPhone, MacBook আর স্মার্টওয়াচের দাম পাশাপাশি দেখুন।",
  cloudflareAnalyticsToken: null,
  heroTitle: "কোন দোকানে কত দাম, এক নজরে দেখুন",
  heroTitleEn: "See every shop's price at a glance",
  quickSearches: ["Galaxy A17", "iPhone 17", "MacBook", "Redmi Note"],
  announcement: null,
  announcementEn: null,
  announcementLink: null,
};

export const CATEGORIES: { id: Category; label: string; hint: string }[] = [
  { id: "mobile", label: "মোবাইল", hint: "Samsung, Xiaomi, Realme" },
  { id: "apple", label: "Apple", hint: "iPhone, MacBook, iPad" },
  { id: "watch", label: "স্মার্টওয়াচ", hint: "Apple Watch, Galaxy Watch" },
];

export const CONDITION_LABEL: Record<Condition, string> = {
  official: "অফিসিয়াল",
  unofficial: "আনঅফিসিয়াল",
  used: "ব্যবহৃত",
};

export const SELLER_KIND_LABEL: Record<SellerKind, string> = {
  website: "অনলাইন দোকান",
  shop: "দোকান",
  group: "ফেসবুক গ্রুপ",
};
