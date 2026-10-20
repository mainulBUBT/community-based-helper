import { DEFAULT_SETTINGS } from "@/config/site";
import type { AuditEntry, DayStat, Job, JobRun, PageStat, ReviewItem, SiteSettings } from "@/types/admin";
import type { Offer, PricePoint, Product, Promo, Seller } from "@/types/catalog";

const now = Date.now();
const ago = (hours: number) => new Date(now - hours * 3600000).toISOString();

export const sampleProducts: Product[] = [
  {
    id: "p1", slug: "samsung-galaxy-a17-5g", name: "Galaxy A17 5G", brand: "Samsung", category: "mobile", releaseYear: 2026, popularity: 98,
    variants: [
      { id: "p1v1", label: "6GB / 128GB", officialPrice: 39999 },
      { id: "p1v2", label: "8GB / 128GB", officialPrice: 43499 },
    ],
  },
  {
    id: "p2", slug: "redmi-note-17-4g", name: "Redmi Note 17 4G", brand: "Xiaomi", category: "mobile", releaseYear: 2026, popularity: 91,
    variants: [
      { id: "p2v1", label: "8GB / 128GB", officialPrice: 32999 },
      { id: "p2v2", label: "8GB / 256GB", officialPrice: 36999 },
    ],
  },
  {
    id: "p3", slug: "redmi-17-4g", name: "Redmi 17 4G", brand: "Xiaomi", category: "mobile", releaseYear: 2026, popularity: 74,
    variants: [{ id: "p3v1", label: "6GB / 128GB", officialPrice: 22999 }],
  },
  {
    id: "p4", slug: "iphone-17", name: "iPhone 17", brand: "Apple", category: "apple", releaseYear: 2025, popularity: 96,
    variants: [
      { id: "p4v1", label: "128GB", officialPrice: null },
      { id: "p4v2", label: "256GB", officialPrice: null },
    ],
  },
  {
    id: "p5", slug: "macbook-neo-13", name: "MacBook Neo 13\"", brand: "Apple", category: "apple", releaseYear: 2026, popularity: 82,
    variants: [
      { id: "p5v1", label: "8GB / 256GB", officialPrice: 99999 },
      { id: "p5v2", label: "8GB / 512GB", officialPrice: 112999 },
    ],
  },
  {
    id: "p6", slug: "macbook-air-13-m5", name: "MacBook Air 13\" M5", brand: "Apple", category: "apple", releaseYear: 2026, popularity: 70,
    variants: [{ id: "p6v1", label: "16GB / 512GB", officialPrice: null }],
  },
  {
    id: "p7", slug: "apple-watch-se-44mm", name: "Watch SE 44mm", brand: "Apple", category: "watch", releaseYear: 2025, popularity: 66,
    variants: [{ id: "p7v1", label: "GPS", officialPrice: null }],
  },
  {
    id: "p8", slug: "galaxy-watch-8-44mm", name: "Galaxy Watch8 44mm", brand: "Samsung", category: "watch", releaseYear: 2025, popularity: 58,
    variants: [{ id: "p8v1", label: "Bluetooth", officialPrice: 38999 }],
  },
];

export const sampleSellers: Seller[] = [
  { id: "s1", name: "Star Tech", kind: "website", website: "https://www.startech.com.bd/", phone: null, whatsapp: null, facebook: null, area: null, verified: true, active: true },
  { id: "s2", name: "Pickaboo", kind: "website", website: "https://www.pickaboo.com/", phone: null, whatsapp: null, facebook: null, area: null, verified: true, active: true },
  { id: "s3", name: "Apple Gadgets", kind: "website", website: "https://www.applegadgetsbd.com/", phone: null, whatsapp: null, facebook: null, area: null, verified: true, active: true },
  { id: "s4", name: "Gadget & Gear", kind: "website", website: "https://gadgetandgear.com/", phone: null, whatsapp: null, facebook: null, area: null, verified: true, active: true },
  { id: "s5", name: "নমুনা মোবাইল হাউস", kind: "shop", website: null, phone: "01000-000001", whatsapp: "01000-000001", facebook: null, area: "বসুন্ধরা সিটি", verified: true, active: true },
  { id: "s6", name: "নমুনা টেলিকম", kind: "shop", website: null, phone: "01000-000002", whatsapp: null, facebook: null, area: "মোতালিব প্লাজা", verified: false, active: true },
  { id: "s7", name: "নমুনা গ্যাজেট গ্রুপ", kind: "group", website: null, phone: "01000-000003", whatsapp: "01000-000003", facebook: "https://facebook.com/groups/", area: "ঢাকা", verified: false, active: true },
];

type OfferSeed = [string, string, string, Offer["condition"], number, number | null, boolean | null, number, Offer["source"], string?];

const offerSeeds: OfferSeed[] = [
  ["o1", "p1v1", "s2", "official", 39999, 41499, true, 2, "site"],
  ["o2", "p1v1", "s1", "official", 40500, null, true, 3, "site"],
  ["o3", "p1v1", "s4", "official", 40999, null, true, 5, "site"],
  ["o4", "p1v1", "s5", "official", 41200, null, null, 48, "seller"],
  ["o5", "p1v1", "s6", "unofficial", 33500, null, null, 26, "seller"],
  ["o6", "p1v2", "s2", "official", 43499, null, true, 2, "site"],
  ["o7", "p1v2", "s1", "official", 43900, null, false, 3, "site"],
  ["o8", "p1v2", "s3", "official", 44500, null, true, 6, "site"],
  ["o9", "p2v1", "s1", "official", 32999, 33999, true, 4, "site"],
  ["o10", "p2v1", "s4", "official", 33499, null, true, 7, "site"],
  ["o11", "p2v2", "s1", "official", 36999, null, true, 4, "site"],
  ["o12", "p3v1", "s1", "official", 22999, null, true, 4, "site"],
  ["o13", "p3v1", "s2", "official", 23499, null, true, 9, "site"],
  ["o14", "p4v1", "s3", "official", 152000, null, true, 5, "site"],
  ["o15", "p4v1", "s5", "unofficial", 142000, null, null, 20, "seller", "USA"],
  ["o16", "p4v1", "s7", "unofficial", 139500, null, null, 30, "user", "USA"],
  ["o17", "p4v2", "s3", "official", 172000, null, true, 5, "site"],
  ["o18", "p5v1", "s3", "official", 97500, 99500, true, 8, "site"],
  ["o19", "p5v1", "s1", "official", 97000, null, true, 6, "site"],
  ["o20", "p5v2", "s1", "official", 112000, null, true, 6, "site"],
  ["o21", "p6v1", "s3", "official", 154000, null, true, 8, "site"],
  ["o22", "p6v1", "s5", "unofficial", 146500, null, null, 40, "seller", "USA"],
  ["o23", "p7v1", "s5", "unofficial", 31500, null, null, 22, "seller"],
  ["o24", "p7v1", "s3", "official", 34900, null, true, 10, "site"],
  ["o25", "p8v1", "s2", "official", 38999, null, true, 3, "site"],
  ["o26", "p8v1", "s4", "official", 37999, 38999, true, 5, "site"],
];

export const sampleOffers: Offer[] = offerSeeds.map(([id, variantId, sellerId, condition, price, oldPrice, inStock, hours, source, region]) => {
  const seller = sampleSellers.find((s) => s.id === sellerId);
  return {
    id, variantId, sellerId, condition, price, oldPrice, inStock, source,
    region: region ?? null,
    url: seller?.website ?? null,
    published: true,
    checkedAt: ago(hours),
  };
});

export const samplePromos: Promo[] = [
  { id: "pr1", sellerId: "s2", kind: "কার্ড", text: "City Bank কার্ডে ১০% টাকা ফেরত, সর্বোচ্চ ৳3,000", scope: "সব মোবাইলে", endsOn: "2026-10-31", active: true },
  { id: "pr2", sellerId: "s4", kind: "bKash", text: "bKash এ দিলে ৳500 কম", scope: "৳20,000 এর বেশি কেনাকাটায়", endsOn: "2026-10-25", active: true },
  { id: "pr3", sellerId: "s1", kind: "কিস্তি", text: "১২ মাস পর্যন্ত সুদ ছাড়া কিস্তি", scope: "১৮টা ব্যাংকের কার্ডে", endsOn: null, active: false },
];

export const sampleHistory: PricePoint[] = sampleOffers.flatMap((offer) => {
  const start = offer.oldPrice ?? Math.round(offer.price * 1.04);
  return [
    { offerId: offer.id, price: start, seenAt: ago(24 * 29) },
    { offerId: offer.id, price: Math.round((start + offer.price) / 2), seenAt: ago(24 * 14) },
    { offerId: offer.id, price: offer.price, seenAt: offer.checkedAt },
  ];
});

export const sampleReview: ReviewItem[] = [
  { id: "r1", kind: "match", createdAt: ago(1), payload: { listing: "Samsung Galaxy A17 5G (8+128) Black", seller: "Gadget & Gear", price: "43999", guess: "Galaxy A17 5G, 8GB / 128GB", reason: "নাম আর স্টোরেজ মিলেছে, রংটা বাদ দিয়ে ধরেছে", confidence: "78" } },
  { id: "r2", kind: "match", createdAt: ago(2), payload: { listing: "Redmi Note 17 (Global) 8/256", seller: "Star Tech", price: "36999", guess: "Redmi Note 17 4G, 8GB / 256GB", reason: "Global লেখা মানে আনঅফিসিয়াল কিনা বোঝা যাচ্ছে না", confidence: "62" } },
  { id: "r3", kind: "anomaly", createdAt: ago(3), payload: { product: "Galaxy A17 5G 6GB / 128GB", seller: "Gadget & Gear", from: "40999", to: "16499", reason: "সম্ভবত কভার বা অন্য কিছুর দাম ধরে ফেলেছে" } },
  { id: "r4", kind: "submission", createdAt: ago(0.7), payload: { seller: "নমুনা মোবাইল হাউস, বসুন্ধরা সিটি", product: "iPhone 17 128GB", condition: "আনঅফিসিয়াল (USA)", price: "139500", from: "দোকান নিজে" } },
  { id: "r5", kind: "submission", createdAt: ago(2.2), payload: { seller: "নমুনা টেলিকম, মোতালিব প্লাজা", product: "Galaxy A17 5G 6GB / 128GB", condition: "আনঅফিসিয়াল", price: "33500", from: "একজন ক্রেতা" } },
];

export const sampleJobs: Job[] = [
  { id: "prices", name: "দাম আনা", runner: "Supabase pg_cron", schedule: "প্রতি ১৫ মিনিটে", enabled: true, runRequestedAt: null, lastRunAt: ago(0.2), lastStatus: "ok", lastMessage: "৪৮টা দেখেছে, ৩টার দাম বদলেছে" },
  { id: "js-stores", name: "JavaScript নির্ভর দোকান", runner: "GitHub Actions", schedule: "দিনে দুবার", enabled: true, runRequestedAt: null, lastRunAt: ago(9), lastStatus: "failed", lastMessage: "Gadget & Gear থেকে দাম আসেনি" },
  { id: "discover", name: "নতুন পণ্য খোঁজা আর মেলানো", runner: "GitHub Actions", schedule: "প্রতি রাতে", enabled: true, runRequestedAt: null, lastRunAt: ago(14), lastStatus: "ok", lastMessage: "১২টা নতুন, ৩টা যাচাইয়ে পাঠানো হয়েছে" },
  { id: "promos", name: "অফার পড়া", runner: "Supabase pg_cron", schedule: "দিনে একবার", enabled: true, runRequestedAt: null, lastRunAt: ago(6), lastStatus: "ok", lastMessage: "২টা নতুন অফার" },
  { id: "rebuild", name: "সাইট নতুন করে বানানো (SEO)", runner: "GitHub Actions", schedule: "প্রতি রাতে", enabled: true, runRequestedAt: null, lastRunAt: ago(15), lastStatus: "ok", lastMessage: "৮টা পণ্যের পেজ তৈরি হয়েছে" },
];

export const sampleRuns: JobRun[] = [
  { id: 6, jobId: "prices", status: "ok", message: "৪৮টা দেখেছে, ৩টার দাম বদলেছে", startedAt: ago(0.2) },
  { id: 5, jobId: "prices", status: "ok", message: "৫০টা দেখেছে, কোনো বদল নেই", startedAt: ago(0.45) },
  { id: 4, jobId: "js-stores", status: "failed", message: "Gadget & Gear: পরীক্ষার পণ্যের দাম পাওয়া যায়নি", startedAt: ago(9) },
  { id: 3, jobId: "promos", status: "ok", message: "২টা নতুন অফার যাচাইয়ে", startedAt: ago(6) },
  { id: 2, jobId: "discover", status: "ok", message: "১২টা নতুন listing, ৩টা যাচাইয়ে", startedAt: ago(14) },
  { id: 1, jobId: "rebuild", status: "ok", message: "৮টা পণ্যের পেজ তৈরি হয়েছে", startedAt: ago(15) },
];

export const sampleAudit: AuditEntry[] = [
  { id: 3, action: "seller.verify", detail: { name: "নমুনা মোবাইল হাউস" }, createdAt: ago(5) },
  { id: 2, action: "promo.activate", detail: { text: "City Bank কার্ডে ১০% টাকা ফেরত" }, createdAt: ago(20) },
  { id: 1, action: "settings.update", detail: { section: "SEO" }, createdAt: ago(30) },
];

export const sampleDayStats: DayStat[] = Array.from({ length: 14 }, (_, i) => {
  const day = new Date(now - (13 - i) * 86400000).toISOString().slice(0, 10);
  const visitors = 40 + Math.round(30 * Math.sin(i / 2) + i * 6);
  return { day, visitors, views: visitors * 3 + (i % 4) * 7 };
});

export const samplePageStats: PageStat[] = [
  { path: "/", views: 1240, visitors: 610 },
  { path: "/product/samsung-galaxy-a17-5g/", views: 532, visitors: 301 },
  { path: "/product/iphone-17/", views: 488, visitors: 276 },
  { path: "/search/", views: 410, visitors: 233 },
  { path: "/product/redmi-note-17-4g/", views: 266, visitors: 171 },
  { path: "/product/macbook-neo-13/", views: 198, visitors: 120 },
];

export const sampleSettings: SiteSettings = { ...DEFAULT_SETTINGS };
