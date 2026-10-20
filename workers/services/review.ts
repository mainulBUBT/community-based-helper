import { db, must } from "../lib/db";

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

export async function reviewedUrls(): Promise<Set<string>> {
  const rows = await must(db().from("review_queue").select("payload").eq("kind", "match"));
  return new Set((rows as { payload: ReviewPayload }[]).map((r) => r.payload.url).filter(Boolean));
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
