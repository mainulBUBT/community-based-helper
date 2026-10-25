import { all, db, must } from "../lib/db";

export type ReviewPayload = Record<string, string>;

export async function enqueue(kind: "match" | "anomaly", payload: ReviewPayload) {
  await must(db().from("review_queue").insert({ kind, payload }));
}

export async function pendingAnomaly(offerId: string): Promise<boolean> {
  const rows = await must(
    db().from("review_queue").select("id").eq("kind", "anomaly").eq("status", "pending").eq("payload->>offerId", offerId).limit(1),
  );
  return (rows ?? []).length > 0;
}

export async function rejectedAnomaly(offerId: string, price: number): Promise<boolean> {
  const rows = await must(
    db()
      .from("review_queue")
      .select("id")
      .eq("kind", "anomaly")
      .eq("status", "rejected")
      .eq("payload->>offerId", offerId)
      .eq("payload->>to", String(price))
      .limit(1),
  );
  return (rows ?? []).length > 0;
}

// দাম স্বাভাবিকে ফিরলে পুরনো সন্দেহ আর দরকার নেই
export async function closeAnomaly(offerId: string) {
  await must(
    db()
      .from("review_queue")
      .update({ status: "rejected", resolved_at: new Date().toISOString() })
      .eq("kind", "anomaly")
      .eq("status", "pending")
      .eq("payload->>offerId", offerId),
  );
}

export async function reviewedUrls(sellerId: string): Promise<Set<string>> {
  const rows = await all<{ payload: ReviewPayload }>((from, to) =>
    db().from("review_queue").select("payload").eq("kind", "match").eq("payload->>sellerId", sellerId).order("id").range(from, to),
  );
  return new Set(rows.map((r) => r.payload.url).filter(Boolean));
}

export async function approvedUnapplied() {
  const rows = await must(
    db().from("review_queue").select("id, kind, payload").eq("status", "approved").in("kind", ["match", "anomaly"]).is("applied_at", null),
  );
  return rows as { id: string; kind: "match" | "anomaly"; payload: ReviewPayload }[];
}

export async function markApplied(id: string) {
  await must(db().from("review_queue").update({ applied_at: new Date().toISOString() }).eq("id", id));
}
