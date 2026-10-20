export type ReviewKind = "match" | "anomaly" | "submission";

export interface ReviewItem {
  id: string;
  kind: ReviewKind;
  payload: Record<string, string>;
  createdAt: string;
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

export interface SiteSettings {
  name: string;
  nameEn: string;
  tagline: string;
  phone: string | null;
  email: string | null;
  facebook: string | null;
  logoUrl: string | null;
  seoTitle: string;
  seoDescription: string;
  cloudflareAnalyticsToken: string | null;
  heroTitle: string;
  heroTitleEn: string;
  quickSearches: string[];
  announcement: string | null;
  announcementEn: string | null;
  announcementLink: string | null;
}

export interface PrivateSettings {
  llm: { baseUrl: string; model: string; apiKey: string | null };
  telegramBotToken: string | null;
  alertChatId: string | null;
}

export interface DayStat {
  day: string;
  views: number;
  visitors: number;
}

export interface PageStat {
  path: string;
  views: number;
  visitors: number;
}
