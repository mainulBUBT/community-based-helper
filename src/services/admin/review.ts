import { sampleReview } from "@/data/sample";
import { supabase } from "@/lib/supabase";
import type { ReviewItem } from "@/types/admin";
import { toReviewItem } from "../mappers";
import { logAction } from "./audit";

const RECENT_HOURS = 48;

// মেনুর "যাচাই বাকি" সংখ্যা সাথে সাথে বদলাতে
export const REVIEW_CHANGED = "review-changed";
const announce = () => window.dispatchEvent(new Event(REVIEW_CHANGED));

export async function listPendingReview(): Promise<ReviewItem[]> {
  if (!supabase) return sampleReview.filter((r) => (r.status ?? "pending") === "pending");
  const { data, error } = await supabase.from("review_queue").select("*").eq("status", "pending").order("created_at");
  if (error) throw error;
  return data.map(toReviewItem);
}

// মেনুর সংখ্যার জন্য: পুরো তালিকা নয়, শুধু গোনা
export async function countPendingReview(): Promise<number> {
  if (!supabase) return (await listPendingReview()).length;
  const { count, error } = await supabase.from("review_queue").select("id", { count: "exact", head: true }).eq("status", "pending");
  if (error) throw error;
  return count ?? 0;
}

export async function listRecentDecisions(): Promise<ReviewItem[]> {
  const since = new Date(Date.now() - RECENT_HOURS * 3600_000).toISOString();
  if (!supabase) return sampleReview.filter((r) => r.status && r.status !== "pending" && (r.resolvedAt ?? "") > since);
  const { data, error } = await supabase.from("review_queue").select("*").neq("status", "pending").gt("resolved_at", since).order("resolved_at", { ascending: false }).limit(30);
  if (error) throw error;
  return data.map(toReviewItem);
}

async function setOfferPublished(offerId: string, published: boolean) {
  if (!supabase) return;
  const { error } = await supabase.from("offers").update({ published }).eq("id", offerId);
  if (error) throw error;
}

// patch দিয়ে অ্যাডমিন অন্য ভার্সন বেছে দিতে পারেন; worker পরের দাম আনায় payload থেকেই বসায়
export async function resolveReview(item: ReviewItem, approved: boolean, patch: Record<string, string> = {}) {
  const payload = { ...item.payload, ...patch };
  const status = approved ? "approved" : "rejected";
  const resolvedAt = new Date().toISOString();
  if (!supabase) {
    Object.assign(sampleReview.find((r) => r.id === item.id)!, { payload, status, resolvedAt });
  } else {
    const { error } = await supabase.from("review_queue").update({ status, payload, resolved_at: resolvedAt }).eq("id", item.id);
    if (error) throw error;
    // প্রত্যাখ্যান মানে নতুন পড়াটাই ভুল ছিল — আগের যাচাই করা দাম সাইটে ফিরে আসে
    // (অনুমোদনের দাম বসানো হয় worker এর applyApproved এ, পরের prices run এ)
    if (!approved && item.kind === "anomaly" && payload.offerId) await setOfferPublished(payload.offerId, true);
  }
  announce();
  const detail = Object.fromEntries(Object.entries(payload).filter(([key]) => key !== "phone"));
  await logAction(approved ? "review.approve" : "review.reject", { kind: item.kind, ...detail });
}

// worker এখনো বসায়নি এমন সিদ্ধান্ত আবার যাচাইয়ে ফেরে; ক্রেতার দাম অনুমোদন দিলে সাথে সাথে বসে যায়, তাই ফেরানো যায় না
export const canUndo = (item: ReviewItem) => !item.appliedAt && !(item.kind === "submission" && item.status === "approved");

export async function undoReview(item: ReviewItem) {
  if (!canUndo(item)) throw new Error("already applied");
  if (!supabase) {
    Object.assign(sampleReview.find((r) => r.id === item.id)!, { status: "pending", resolvedAt: null });
  } else {
    const { error } = await supabase.from("review_queue").update({ status: "pending", resolved_at: null }).eq("id", item.id).is("applied_at", null);
    if (error) throw error;
    if (item.kind === "anomaly" && item.status === "rejected" && item.payload.offerId) await setOfferPublished(item.payload.offerId, false);
  }
  announce();
  await logAction("review.undo", { kind: item.kind, decision: item.status ?? "" });
}
