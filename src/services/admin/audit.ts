import { sampleAudit } from "@/data/sample";
import { supabase } from "@/lib/supabase";
import { toAudit } from "../mappers";

export async function logAction(action: string, detail: Record<string, unknown>) {
  if (!supabase) {
    sampleAudit.unshift({ id: Date.now(), action, detail, createdAt: new Date().toISOString() });
    return;
  }
  const { error } = await supabase.from("audit_log").insert({ action, detail });
  if (error) throw error;
}

export async function listAudit(limit = 100) {
  if (!supabase) return sampleAudit.slice(0, limit);
  const { data, error } = await supabase.from("audit_log").select("*").order("created_at", { ascending: false }).limit(limit);
  if (error) throw error;
  return data.map(toAudit);
}
