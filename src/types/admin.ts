export type ReviewKind = "match" | "anomaly" | "submission";

export interface ReviewItem {
  id: string;
  kind: ReviewKind;
  payload: Record<string, string>;
  createdAt: string;
  status?: "pending" | "approved" | "rejected";
  resolvedAt?: string | null;
  appliedAt?: string | null;
}

export interface Job {
  id: string;
  name: string;
  runner: string;
  schedule: string;
  enabled: boolean;
  runRequestedAt: string | null;
  lastRunAt: string | null;
  lastStatus: string | null;
  lastMessage: string | null;
}

export interface JobRun {
  id: number;
  jobId: string;
  status: string;
  message: string | null;
  startedAt: string;
}

export interface AuditEntry {
  id: number;
  action: string;
  detail: Record<string, unknown> | null;
  createdAt: string;
}

export interface RegionNote {
  region: string;
  note: string;
  noteEn: string;
}

export interface SiteSettings {
  name: string;
  nameEn: string;
  tagline: string;
  taglineEn: string;
  phone: string | null;
  email: string | null;
  facebook: string | null;
  logoUrl: string | null;
  seoTitle: string;
  seoDescription: string;
  seoTitleEn: string;
  seoDescriptionEn: string;
  cloudflareAnalyticsToken: string | null;
  heroTitle: string;
  heroTitleEn: string;
  heroEyebrow: string;
  heroEyebrowEn: string;
  quickSearches: string[];
  showDrops: boolean;
  showSpotlight: boolean;
  showCategoryRows: boolean;
  showBrands: boolean;
  showSellers: boolean;
  dropsInterval: number;
  announcement: string | null;
  announcementEn: string | null;
  announcementLink: string | null;
  regionNotes: RegionNote[];
  aboutWho: string;
  aboutWhoEn: string;
  aboutWhat: string;
  aboutWhatEn: string;
}

export interface LlmModel {
  baseUrl: string;
  model: string;
}

export interface PrivateSettings {
  llm: { baseUrl: string; model: string; apiKey: string | null };
  // পছন্দের ক্রমে; ওপরেরটা আগে চলে, quota শেষ হলে পরেরটা
  llmModels?: LlmModel[];
  // প্রতিটা প্রোভাইডারের key, Base URL ধরে (ব্রাউজারে শুধু ঢাকা রূপ আসে)
  llmKeys?: Record<string, string>;
  telegramBotToken: string | null;
  alertChatId: string | null;
}

export interface UsageStats {
  dbBytes: number;
  viewsToday: number;
  alerts: number;
  deploysThisMonth: number;
  lastJobRun: string | null;
  // শেষ rebuild যা লিখে গেছে; প্রথম rebuild-এর আগে খালি
  deploy: { files?: number; bytes?: number; largest?: number; lastCommit?: string | null; at?: string };
}

export interface OnlineVisitor {
  path: string;
  product: string | null;
  country: string | null;
  device: string | null;
  seenAt: string;
}

export interface DayStat {
  day: string;
  views: number;
  visitors: number;
}

export interface Breakdown {
  key: string | null;
  views: number;
  visitors: number;
}

export interface VisitorInsights {
  visitors: number;
  returning: number;
  countries: Breakdown[];
  devices: Breakdown[];
  referrers: Breakdown[];
  products: (Breakdown & { slug: string })[];
  searches: Breakdown[];
}

export interface PageStat {
  path: string;
  views: number;
  visitors: number;
}
