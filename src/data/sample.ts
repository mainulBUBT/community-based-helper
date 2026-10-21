import { DEFAULT_CATEGORIES, DEFAULT_SETTINGS } from "@/config/site";
import type { AuditEntry, DayStat, Job, JobRun, PageStat, ReviewItem, SiteSettings } from "@/types/admin";
import type { CategoryInfo, Offer, PricePoint, Product, Promo, Seller } from "@/types/catalog";
import { catalogOffers, catalogProducts, catalogSellers } from "./catalog.generated";

export const sampleCategories: CategoryInfo[] = DEFAULT_CATEGORIES.map((c) => ({ ...c }));

export const sampleProducts: Product[] = catalogProducts.map((p) => ({ ...p, variants: p.variants.map((v) => ({ ...v })) }));

export const sampleSellers: Seller[] = catalogSellers.map((s) => ({ ...s }));

export const sampleOffers: Offer[] = catalogOffers.map((o) => ({ ...o }));

export const samplePromos: Promo[] = [];

export const sampleHistory: PricePoint[] = sampleOffers.map((offer) => ({ offerId: offer.id, price: offer.price, seenAt: offer.checkedAt }));

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

export const sampleAudit: AuditEntry[] = [];

export const sampleDayStats: DayStat[] = Array.from({ length: 14 }, (_, i) => ({
  day: new Date(Date.now() - (13 - i) * 86400000).toISOString().slice(0, 10),
  visitors: 0,
  views: 0,
}));

export const samplePageStats: PageStat[] = [];

export const sampleSettings: SiteSettings = { ...DEFAULT_SETTINGS };
