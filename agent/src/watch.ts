import { bn, RUNNABLE, type JobRow } from "./tools";

export interface Episode {
  retriedAt?: number;
  alerted?: boolean;
}

export interface WatchState {
  jobs: Record<string, Episode>;
  hosts?: Record<string, number>;
}

export type Verdict = "fine" | "wait" | "retry" | "alert";

const HOUR = 3_600_000;
const RETRY_WAIT = 2 * HOUR;
const HOST_MEMORY = 7 * 24 * HOUR;

// গত ৭ দিনের সবচেয়ে বড় ফাঁকের (prices ১১.৬, discover ১৪, rebuild ৯.৮, promos ২৪.৮ ঘণ্টা) চেয়ে বেশি, যাতে GitHub-এর দেরিতে ভুল খবর না যায়।
// local_discover নতুন পণ্য এলে তবেই চলে, তাই তার ফাঁক সমস্যা নয়।
const LIMIT_HOURS: Record<string, number> = { prices: 16, discover: 20, rebuild: 16, promos: 36, local_prices: 48 };

export const WATCHED = Object.keys(LIMIT_HOURS);

// এই কাজ থামলে দাম পুরনো হয় বা সাইট আপডেট বন্ধ হয়: শুধু এগুলোই Telegram-এ। বাকি খবর সকালের রিপোর্টে
const DANGER = ["prices", "discover", "rebuild"];
export const isDanger = (id: string) => DANGER.includes(id);

// workers/lib/http.ts-এর StoreBlocked-এর লেখা; prices, promos আর discover তিনটার বার্তাতেই এই রূপে আসে
const BLOCKED = /([a-z0-9.-]+\.[a-z]{2,}): (?:HTTP \d{3}|robots\.txt \d{3}|bot challenge)/g;

const ageOf = (job: JobRow, now: number) => (job.last_run_at ? now - Date.parse(job.last_run_at) : Infinity);

export function judge(job: JobRow, episode: Episode | undefined, now: number): Verdict {
  const limit = LIMIT_HOURS[job.id];
  if (!job.enabled || !limit) return "fine";
  const stale = ageOf(job, now) > limit * HOUR;
  if (job.last_status === "running" && !stale) return "wait";
  const runnable = RUNNABLE.includes(job.id);
  // লোকাল জব ব্যর্থ হলে worker নিজেই জানায়, আর আবার চালানো যায় শুধু মালিকের মেশিন থেকে
  if (!stale && !(runnable && job.last_status === "failed")) return "fine";
  if (episode?.alerted) return "wait";
  if (!runnable) return "alert";
  if (!episode?.retriedAt) return "retry";
  const restarted = Boolean(job.last_run_at) && Date.parse(job.last_run_at as string) > episode.retriedAt;
  return restarted || now - episode.retriedAt > RETRY_WAIT ? "alert" : "wait";
}

export function alertText(job: JobRow, now: number): string {
  const hours = Math.round(ageOf(job, now) / HOUR);
  if (job.id === "local_prices") return `⚠️ লোকাল রানার ${bn(hours)} ঘণ্টা চলেনি। আটকানো দোকানগুলোর দাম এখন হালনাগাদ হচ্ছে না। মেশিনে রানারটা চালু করে দিন।`;
  const mark = isDanger(job.id) ? "🚨" : "⚠️";
  if (job.last_status === "failed") return `${mark} "${job.name}" আবার চালিয়েও ব্যর্থ।\nকারণ: ${(job.last_message ?? "জানা যায়নি").slice(0, 200)}\nঅ্যাডমিন → অটোমেশন ও AI পাতায় দেখুন।`;
  return `${mark} "${job.name}" ${Number.isFinite(hours) ? `${bn(hours)} ঘণ্টা ধরে` : "এখনো"} চলেনি। আবার চালাতে দিয়েও শুরু হয়নি। GitHub Actions-এ কাজটা বন্ধ হয়ে গেছে কি না দেখুন।`;
}

export const retryNote = (job: JobRow) => `🔁 "${job.name}" ${job.last_status === "failed" ? "ব্যর্থ হয়েছিল" : "অনেকক্ষণ চলেনি"}, তাই একবার আবার চালাতে দিলাম।`;

export function blockedHosts(messages: (string | null)[]): string[] {
  return [...new Set(messages.flatMap((text) => [...(text ?? "").matchAll(BLOCKED)].map((match) => match[1])))];
}

// প্রথমবার যা আটকানো পাওয়া যায় তা পুরনো ধরা হয়, নইলে চালু হতেই একগাদা খবর যেত
export const newHosts = (seen: string[], known: WatchState["hosts"]) => (known ? seen.filter((host) => !(host in known)) : []);

export function rememberHosts(seen: string[], known: WatchState["hosts"], now: number): Record<string, number> {
  const kept = Object.entries(known ?? {}).filter(([, at]) => now - at < HOST_MEMORY);
  return { ...Object.fromEntries(kept), ...Object.fromEntries(seen.map((host) => [host, now])) };
}

export const hostsText = (hosts: string[]) => `🚧 নতুন করে আটকাচ্ছে: ${hosts.join(", ")}। কয়েক দিন চললে দোকানটা লোকাল রানারে নেওয়া বা বন্ধ রাখার সিদ্ধান্ত আপনার।`;

// ঢাকার সময় রাত ১১টা থেকে সকাল ৮টা
export function isQuiet(now: number): boolean {
  const hour = (new Date(now).getUTCHours() + 6) % 24;
  return hour >= 23 || hour < 8;
}
