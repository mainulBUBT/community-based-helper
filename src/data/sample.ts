import { DEFAULT_CATEGORIES, DEFAULT_SETTINGS } from "@/config/site";
import type { AuditEntry, DayStat, Job, JobRun, ManagerStatus, PageStat, ReviewItem, SiteSettings } from "@/types/admin";
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
  job("discover", "নতুন পণ্য খোঁজা আর মেলানো", "নতুন পণ্য যোগ হলেই, আর প্রতি রাতে"),
  job("promos", "অফার পড়া", "দিনে একবার"),
  job("rebuild", "সাইট নতুন করে বানানো (SEO)", "প্রতি রাতে"),
];

export const sampleRuns: JobRun[] = [];

export const sampleManagerReply = "ডেমোতে আসল ম্যানেজার নেই। লাইভে এখানে উত্তর আসবে।";

const today = (hour: number) => new Date(new Date().setHours(hour, 0, 0, 0)).toISOString();

export const sampleManager: ManagerStatus = {
  model: "gpt-4.1-mini",
  models: 2,
  telegram: true,
  nextReport: new Date(Date.now() + 86_400_000).toISOString(),
  history: [
    { id: 1, role: "schedule", text: "সকালের রিপোর্ট", steps: [], at: today(9) },
    {
      id: 2,
      role: "manager",
      text: "সুপ্রভাত! ⚠️ দাম আনার কাজ কাল রাতে ব্যর্থ হয়েছে (Star Tech timeout)। 📝 যাচাই বাকি ৮টা। 🔎 ভিজিটর সবচেয়ে বেশি খুঁজেছে \"redmi note 15\"।",
      steps: [
        { call: "jobs_status()", result: "৪টা কাজ · ১টা ব্যর্থ", tone: "bad" },
        { call: "review_queue()", result: "৮টা যাচাই বাকি", tone: "wait" },
        { call: "visitor_searches(1)", result: "২৩টা আলাদা খোঁজ", tone: "ok" },
      ],
      at: today(9),
    },
  ],
};

export const sampleAudit: AuditEntry[] = [];

export const sampleDayStats: DayStat[] = Array.from({ length: 14 }, (_, i) => ({
  day: new Date(Date.now() - (13 - i) * 86400000).toISOString().slice(0, 10),
  visitors: 0,
  views: 0,
}));

export const samplePageStats: PageStat[] = [];

export const sampleSettings: SiteSettings = { ...DEFAULT_SETTINGS };
