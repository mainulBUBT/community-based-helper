import { db } from "../lib/db";
import { isLocalUrl } from "../stores/local";
import { discoverStore, sellerStores, type StoreResult } from "./discover";
import type { JobRun } from "./run";

// নতুন পণ্য এই ১৮ দোকানেও খোঁজা: GitHub এর discover এদের "blocked" দেখে এগিয়ে যায় কিন্তু পণ্যকে "খোঁজা হয়েছে" ধরে,
// তাই এখানে চিহ্ন নয়, সময়: এই জবের শেষ সফল run এর পর যোগ বা বদলানো পণ্য। কোনো দোকান না হলে run ব্যর্থ ধরা হয়, পরের বার একই পণ্য আবার।
const DEFAULT_DAYS = 3;

export async function lastOkRun(job: string, current: number): Promise<string | null> {
  const { data } = await db().from("job_runs").select("started_at").eq("job_id", job).eq("status", "ok").neq("id", current).order("started_at", { ascending: false }).limit(1);
  return data?.[0]?.started_at ?? null;
}

export const localSince = async (run: JobRun) => (await lastOkRun(run.job, run.id)) ?? new Date(Date.now() - DEFAULT_DAYS * 86_400_000).toISOString();

export async function localDiscover(run: JobRun): Promise<string> {
  const since = await localSince(run);
  const active = (await sellerStores()).filter(({ store }) => isLocalUrl(store.origin));
  const results: StoreResult[] = await Promise.all(active.map(({ store, seller }) => discoverStore(store, seller, since)));
  const total = (key: "added" | "review" | "failed") => results.reduce((sum, r) => sum + r[key], 0);
  const notes = results.flatMap((r) => r.notes);
  const summary = `Searched ${active.length} stores for products added after ${since.slice(0, 16).replace("T", " ")}: ${total("added")} new prices, ${total("review")} sent to review, ${total("failed")} failed`;
  if (notes.length || results.some((r) => !r.finished)) throw new Error([summary, ...notes].join("; "));
  return summary;
}
