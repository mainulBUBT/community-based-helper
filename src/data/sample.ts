import { DEFAULT_CATEGORIES, DEFAULT_SETTINGS } from "@/config/site";
import type { AuditEntry, DayStat, Job, JobRun, PageStat, ReviewItem, SiteSettings } from "@/types/admin";
import type { CategoryInfo, Promo } from "@/types/catalog";

export const sampleCategories: CategoryInfo[] = DEFAULT_CATEGORIES.map((c) => ({ ...c }));

export const samplePromos: Promo[] = [];

export const loadSampleCatalog = () => import("./sample-catalog");

export const sampleReview: ReviewItem[] = [];

const job = (id: string, name: string, schedule: string): Job => ({
  id, name, runner: "GitHub Actions", schedule, enabled: true, runRequestedAt: null, lastRunAt: null, lastStatus: null, lastMessage: null,
});

export const sampleJobs: Job[] = [
  job("prices", "দাম আনা", "প্রতি ৬ ঘণ্টায়"),
  job("special_sync", "বিশেষ দোকানের দাম সিঙ্ক", "দিনে দুবার"),
  job("discover", "নতুন পণ্য খোঁজা আর মেলানো", "নতুন পণ্য যোগ হলেই, আর প্রতি রাতে"),
  job("promos", "অফার পড়া", "দিনে একবার"),
  job("rebuild", "সাইট নতুন করে বানানো (SEO)", "প্রতি রাতে"),
];

export const sampleRuns: JobRun[] = [];

export const sampleAudit: AuditEntry[] = [];

export const sampleDayStats: DayStat[] = Array.from({ length: 14 }, (_, i) => ({
  day: new Date(Date.now() - (13 - i) * 86400000).toISOString().slice(0, 10),
  visitors: 0,
  views: 0,
}));

export const samplePageStats: PageStat[] = [];

export const sampleSettings: SiteSettings = { ...DEFAULT_SETTINGS };
