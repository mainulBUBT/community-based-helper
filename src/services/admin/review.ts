import { sampleReview } from "@/data/sample";
import { supabase } from "@/lib/supabase";
import type { ReviewItem } from "@/types/admin";
import { toReviewItem } from "../mappers";
import { logAction } from "./audit";

export async function listPendingReview(): Promise<ReviewItem[]> {
  if (!supabase) return [...sampleReview];
  const { data, error } = await supabase.from("review_queue").select("*").eq("status", "pending").order("created_at");
  if (error) throw error;
  return data.map(toReviewItem);
}

export async function resolveReview(item: ReviewItem, approved: boolean) {
  if (!supabase) {
    sampleReview.splice(sampleReview.findIndex((r) => r.id === item.id), 1);
  } else {
    const { error } = await supabase
      .from("review_queue")
      .update({ status: approved ? "approved" : "rejected", resolved_at: new Date().toISOString() })
      .eq("id", item.id);
    if (error) throw error;
  }
  await logAction(approved ? "review.approve" : "review.reject", { kind: item.kind, ...item.payload });
}
