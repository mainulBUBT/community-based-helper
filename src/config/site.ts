import type { CategoryInfo, Condition, SellerKind } from "@/types/catalog";
import type { SiteSettings } from "@/types/admin";

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://dordam.app").replace(/\/+$/, "");

export const DEFAULT_SETTINGS: SiteSettings = {
  name: "দরদাম",
  nameEn: "Dordam",
  tagline: "বাংলাদেশের সব দোকানের দাম, পাশাপাশি এক জায়গায়",
  taglineEn: "Prices from shops across Bangladesh, side by side",
  phone: null,
  email: null,
  facebook: null,
  logoUrl: null,
  seoTitle: "দরদাম — আগে দাম যাচাই, তারপর স্মার্ট কেনা",
  seoDescription: "বাংলাদেশের সব দোকানের দাম পাশাপাশি দেখুন, কোথায় সবচেয়ে কম তা কেনার আগেই জেনে নিন।",
  seoTitleEn: "Dordam — Compare first, buy smart",
  seoDescriptionEn: "See prices from shops across Bangladesh side by side, and find the lowest before you buy.",
  cloudflareAnalyticsToken: null,
  heroTitle: "কোন দোকানে কত দাম, এক নজরে দেখুন",
  heroTitleEn: "See every shop's price at a glance",
  quickSearches: ["iPhone 17 Pro", "Galaxy A17", "Redmi Note 17", "MacBook Air", "AirPods"],
  announcement: null,
  announcementEn: null,
  announcementLink: null,
  aboutWho: "দরদাম একটা স্বাধীন দাম-তুলনার সাইট। আমরা কোনো দোকান নই, কিছু বিক্রিও করি না, কোনো দোকানের হয়ে কাজও করি না।",
  aboutWhoEn: "Dordam is an independent price comparison site. We're not a shop, we don't sell anything, and we don't work for any shop.",
  aboutWhat: "বাংলাদেশের দোকানগুলো থেকে একই পণ্যের দাম জোগাড় করে পাশাপাশি দেখাই, যাতে কেনার আগে যাচাই করে সবচেয়ে ভালো দামে কিনতে পারেন।",
  aboutWhatEn: "We gather prices for the same product from shops across Bangladesh and show them side by side, so you can check before you buy and pay the best price.",
  regionNotes: [
    { region: "USA", note: "USA ভার্সনের iPhone এ শুধু eSIM, ফিজিক্যাল সিম কার্ড লাগানো যায় না।", noteEn: "US iPhones are eSIM-only; there's no physical SIM slot." },
    { region: "Japan", note: "Japan ভার্সনে ক্যামেরার শাটারের শব্দ বন্ধ করা যায় না।", noteEn: "Japanese models play a camera shutter sound that can't be turned off." },
    { region: "Global", note: "আন্তর্জাতিক ভার্সন। ব্র্যান্ডের নয়, শুধু দোকানের ওয়ারেন্টি থাকে।", noteEn: "International version. Only the shop's warranty applies, not the brand's." },
  ],
};

export const DEFAULT_CATEGORIES: CategoryInfo[] = [
  { slug: "mobile", name: "মোবাইল", nameEn: "Mobiles", icon: "smartphone", axes: ["ram", "storage"], position: 1, active: true },
  { slug: "laptop", name: "ল্যাপটপ", nameEn: "Laptops", icon: "laptop", axes: ["chip", "ram", "storage"], position: 2, active: true },
  { slug: "tablet", name: "ট্যাবলেট", nameEn: "Tablets", icon: "tablet", axes: ["storage", "connectivity"], position: 3, active: true },
  { slug: "desktop", name: "ডেস্কটপ", nameEn: "Desktops", icon: "monitor", axes: ["chip", "ram", "storage"], position: 4, active: true },
  { slug: "watch", name: "স্মার্টওয়াচ", nameEn: "Smartwatches", icon: "watch", axes: ["size", "connectivity"], position: 5, active: true },
  { slug: "audio", name: "অডিও", nameEn: "Audio", icon: "headphones", axes: ["color"], position: 6, active: true },
  { slug: "earbuds", name: "ইয়ারবাড", nameEn: "Earbuds", icon: "headphones", axes: ["color"], parent: "audio", position: 7, active: true },
  { slug: "headphones", name: "হেডফোন", nameEn: "Headphones", icon: "headphones", axes: ["color"], parent: "audio", position: 8, active: true },
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
